local REPO = 'likitinwzaaa/Rxy_Store'
local CHECK_EVERY = 6 * 60 * 60 * 1000
local SECURITY_TAG = '[security]'

local current = GetResourceMetadata(GetCurrentResourceName(), 'version', 0) or '0.0.0'
local lastTold = nil

local function log(color, msg)
    print(('^%s[Rxy_Store]^7 %s^7'):format(color, msg))
end

local function parse(v)
    local a, b, c = tostring(v):match('^v?(%d+)%.(%d+)%.(%d+)')
    if not a then return nil end
    return { tonumber(a), tonumber(b), tonumber(c) }
end

local function isNewer(a, b)
    for i = 1, 3 do
        if a[i] ~= b[i] then return a[i] > b[i] end
    end
    return false
end

local function clean(s)
    return (tostring(s or ''):gsub('%^', ''):gsub('\r', ''))
end

local function check(manual)
    local mine = parse(current)
    if not mine then
        log('3', 'Could not read the version in fxmanifest, skipping update check')
        return
    end

    local url = ('https://api.github.com/repos/%s/releases?per_page=20'):format(REPO)
    PerformHttpRequest(url, function(status, body)
        if status ~= 200 or not body then
            if manual then log('3', 'Could not check for updates') end
            return
        end

        local ok, releases = pcall(json.decode, body)
        if not ok or type(releases) ~= 'table' then return end

        local newest, newestVer, security = nil, nil, false
        for _, r in ipairs(releases) do
            local v = not r.draft and not r.prerelease and parse(r.tag_name)
            if v and isNewer(v, mine) then
                if clean(r.name):lower():find(SECURITY_TAG, 1, true) then
                    security = true
                end
                if not newestVer or isNewer(v, newestVer) then
                    newest, newestVer = r, v
                end
            end
        end

        if not newest then
            if manual then log('2', 'Rxy_Store is up to date') end
            lastTold = lastTold or false
            return
        end

        if not Config.UpdateCheck and not security then return end
        if not manual and not security and lastTold == newest.tag_name then return end
        lastTold = newest.tag_name

        if security then
            log('1', 'A security update is available, please update as soon as possible')
        else
            log('3', 'A new update is available')
        end
        log('7', ('https://github.com/%s/releases/latest'):format(REPO))
    end, 'GET', '', {
        ['User-Agent'] = 'Rxy_Store',
        ['Accept'] = 'application/vnd.github+json',
    })
end

CreateThread(function()
    Wait(5000)
    while true do
        check(false)
        Wait(CHECK_EVERY)
    end
end)

RegisterCommand('rxystore_version', function(source)
    if source ~= 0 then return end
    check(true)
end, true)
