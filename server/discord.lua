Discord = {}

local API = 'https://discord.com/api/v10'
local queue = {}
local running = false

local function token()
    return GetConvar('rxystore_discord_token', '')
end

local function pump()
    if running then return end
    running = true
    CreateThread(function()
        while #queue > 0 do
            local job = table.remove(queue, 1)
            local p = promise.new()
            PerformHttpRequest(job.url, function(status, body)
                p:resolve({ status = status, body = body })
            end, job.method, job.body or '', job.headers or {})
            local res = Citizen.Await(p)

            if res.status == 429 and (job.tries or 0) < 5 then
                local data = DB.json(res.body, {})
                job.tries = (job.tries or 0) + 1
                table.insert(queue, 1, job)
                Wait(math.ceil((tonumber(data.retry_after) or 1) * 1000))
            else
                if job.cb then
                    local ok, err = pcall(job.cb, res.status, res.body)
                    if not ok then Log.error('discord', tostring(err)) end
                end
                Wait(50)
            end
        end
        running = false
    end)
end

local function push(job)
    queue[#queue + 1] = job
    pump()
end

function Discord.ready()
    return token() ~= '' and (Config.Discord.GuildId or '') ~= ''
end

function Discord.member(discordId, cb)
    if not Discord.ready() or not discordId then
        cb(nil)
        return
    end
    push({
        method = 'GET',
        url = ('%s/guilds/%s/members/%s'):format(API, Config.Discord.GuildId, discordId),
        headers = { Authorization = 'Bot ' .. token() },
        cb = function(status, body)
            if status == 200 then
                local member = DB.json(body, {})
                cb(member.roles or {})
            elseif status == 404 then
                cb(false)
            else
                cb(nil)
            end
        end,
    })
end

function Discord.escape(text)
    return (tostring(text or ''):gsub('([\\%*_~`|>])', '\\%1'))
end

function Discord.log(kind, title, lines, color)
    local url = GetConvar('rxystore_webhook_' .. kind, '')
    if url == '' then return end

    local text = table.concat(lines or {}, '\n')
    if #text > 4000 then text = text:sub(1, 4000) .. '\n...' end

    push({
        method = 'POST',
        url = url,
        headers = { ['Content-Type'] = 'application/json' },
        body = json.encode({
            allowed_mentions = { parse = {} },
            embeds = {
                {
                    title = title,
                    description = text,
                    color = color or 0x2B2D31,
                    timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
                },
            },
        }),
    })
end
