Requests = {}

local handlers = {}
local buckets = {}

function Requests.on(name, options, fn)
    handlers[name] = {
        fn = fn,
        admin = options.admin,
        dev = options.dev,
        limit = options.limit or 10,
        per = options.per or 10,
    }
end

local function reply(src, id, ok, data)
    TriggerClientEvent('rxy_store:res', src, id, ok, data)
end

local function allowed(src, name, handler)
    local now = os.time()
    buckets[src] = buckets[src] or {}
    local bucket = buckets[src][name]
    if not bucket or now - bucket.start >= handler.per then
        bucket = { start = now, count = 0 }
        buckets[src][name] = bucket
    end
    bucket.count = bucket.count + 1
    return bucket.count <= handler.limit
end

RegisterNetEvent('rxy_store:req', function(id, name, payload)
    local src = source
    if type(id) ~= 'number' or type(name) ~= 'string' or #name > 32 then return end

    local handler = handlers[name]
    if not handler then return reply(src, id, false, 'unknown') end
    if not allowed(src, name, handler) then return reply(src, id, false, 'rate') end
    if not DB.ready then return reply(src, id, false, 'not_ready') end
    if type(payload) ~= 'table' then payload = {} end

    CreateThread(function()
        if handler.dev and not Perms.isDev(src) then return reply(src, id, false, 'forbidden') end
        if handler.admin and not Perms.isAdmin(src) then return reply(src, id, false, 'forbidden') end

        local ok, data, err = pcall(handler.fn, src, payload)
        if not ok then
            Log.error('request', ('%s: %s'):format(name, tostring(data)))
            return reply(src, id, false, 'error')
        end
        if data == nil then return reply(src, id, false, err or 'error') end
        reply(src, id, true, data)
    end)
end)

AddEventHandler('playerDropped', function()
    buckets[source] = nil
end)
