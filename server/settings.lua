Settings = {}

local stored = {}

local defaults = {
    name = 'RXY STORE',
    theme = { primary = '#FF7A1A' },
    bannerSeconds = 5,
}

local fromConfig = {
    name = function() return Config.ShopName end,
    theme = function() return Config.Theme end,
}

function Settings.load()
    stored = {}
    local rows = DB.query('SELECT k, v FROM {settings}') or {}
    for _, row in ipairs(rows) do
        stored[row.k] = DB.json(row.v, nil)
    end
end

function Settings.save(key, value, by)
    DB.query(
        'INSERT INTO {settings} (k, v, updated_at, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)',
        { key, json.encode(value), DB.now(), by }
    )
    stored[key] = value
end

function Settings.get(key)
    local fn = fromConfig[key]
    local value = fn and fn()
    if value ~= nil then return value end
    if stored[key] ~= nil then return stored[key] end
    return defaults[key]
end

function Settings.locked()
    return {
        name = Config.ShopName ~= nil,
        theme = Config.Theme ~= nil,
        openKey = true,
    }
end

function Settings.public()
    return {
        name = Settings.get('name'),
        theme = Settings.get('theme'),
        openKey = Config.OpenKey,
        bannerSeconds = Settings.get('bannerSeconds'),
        imageHosts = Config.ImageHosts or {},
    }
end
