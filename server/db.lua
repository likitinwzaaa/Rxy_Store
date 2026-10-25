DB = {
    prefix = 'rxy_store_',
    ready = false,
}

local waiting = {}

function DB.t(name)
    return DB.prefix .. name
end

function DB.sql(query)
    return (query:gsub('{(%w[%w_]*)}', function(name)
        return '`' .. DB.prefix .. name .. '`'
    end))
end

function DB.now(offset)
    return os.date('!%Y-%m-%d %H:%M:%S', os.time() + 7 * 3600 + (offset or 0))
end

function DB.onReady(cb)
    if DB.ready then
        CreateThread(cb)
        return
    end
    waiting[#waiting + 1] = cb
end

function DB.setReady()
    DB.ready = true
    for _, cb in ipairs(waiting) do
        CreateThread(cb)
    end
    waiting = {}
end

function DB.time(column)
    return "DATE_FORMAT(" .. column .. ", '%Y-%m-%d %H:%i:%s') AS " .. column
end

function DB.toMs(value)
    if type(value) ~= 'string' then return nil end
    local y, mo, d, h, mi, se = value:match('^(%d+)-(%d+)-(%d+) (%d+):(%d+):(%d+)')
    if not y then return nil end
    y, mo, d = tonumber(y), tonumber(mo), tonumber(d)
    if mo <= 2 then y = y - 1 end
    local era = y // 400
    local yoe = y - era * 400
    local doy = (153 * ((mo + 9) % 12) + 2) // 5 + d - 1
    local doe = yoe * 365 + yoe // 4 - yoe // 100 + doy
    local days = era * 146097 + doe - 719468
    return (days * 86400 + tonumber(h) * 3600 + tonumber(mi) * 60 + tonumber(se) - 7 * 3600) * 1000
end

function DB.fromMs(ms)
    ms = tonumber(ms)
    if not ms then return nil end
    return os.date('!%Y-%m-%d %H:%M:%S', math.floor(ms / 1000) + 7 * 3600)
end

function DB.bool(value)
    return value == true or value == 1 or value == '1'
end

function DB.json(value, fallback)
    if type(value) == 'table' then return value end
    if type(value) ~= 'string' or value == '' then return fallback end
    local ok, data = pcall(json.decode, value)
    if ok and data ~= nil then return data end
    return fallback
end
