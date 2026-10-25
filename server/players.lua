Players = {}

local KEYS = { 'discord', 'steam', 'fivem', 'xbl', 'live' }
local cache = {}
local loading = {}

local function identifiers(src)
    local ids = {}
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        local kind = id:match('^(%w+):')
        if kind == 'license' or kind == 'ip' then
            ids[kind] = ids[kind] or id
        else
            for _, key in ipairs(KEYS) do
                if kind == key then ids[key] = ids[key] or id end
            end
        end
    end
    return ids
end

local function load(src)
    local ids = identifiers(src)
    if not ids.license then return nil end

    local ip = ids.ip and ids.ip:gsub('^ip:', '') or nil
    local name = Bridge.name(src)
    local now = DB.now()
    local row = MySQL.single.await(
        DB.sql('SELECT id, discord, steam, fivem, xbl, live, total_topup FROM {players} WHERE license = ?'),
        { ids.license }
    )

    local mismatch = false
    if row then
        for _, key in ipairs(KEYS) do
            if row[key] and ids[key] and row[key] ~= ids[key] then mismatch = true end
        end
        MySQL.update.await(
            DB.sql('UPDATE {players} SET ip = ?, name = ?, last_seen = ? WHERE id = ?'),
            { ip, name, now, row.id }
        )
    else
        local id = MySQL.insert.await(
            DB.sql([[INSERT INTO {players} (license, discord, steam, fivem, xbl, live, ip, name, first_seen, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)]]),
            { ids.license, ids.discord, ids.steam, ids.fivem, ids.xbl, ids.live, ip, name, now, now }
        )
        row = { id = id, discord = ids.discord, total_topup = 0 }
    end

    return {
        id = tonumber(row.id),
        license = ids.license,
        ids = ids,
        stored = row,
        ip = ip,
        name = name,
        mismatch = mismatch,
        topup = tonumber(row.total_topup) or 0,
    }
end

function Players.get(src)
    src = tonumber(src)
    if not src or not DB.ready then return nil end
    if cache[src] then return cache[src] end

    if loading[src] then
        local p = promise.new()
        table.insert(loading[src], p)
        return Citizen.Await(p)
    end

    loading[src] = {}
    local ok, player = pcall(load, src)
    if not ok then
        Log.error('players', 'Failed to load player: ' .. tostring(player))
        player = nil
    end
    if player and GetPlayerName(src) then cache[src] = player end

    local waiting = loading[src]
    loading[src] = nil
    for _, p in ipairs(waiting) do p:resolve(player) end
    return player
end

function Players.discordId(src)
    local player = Players.get(src)
    if not player or not player.ids.discord then return nil end
    return (player.ids.discord:gsub('^discord:', ''))
end

function Players.roles(src, maxAge)
    local player = Players.get(src)
    if not player then return nil end
    if player.rolesAt and os.time() - player.rolesAt < (maxAge or 300) then return player.roles end

    local id = Players.discordId(src)
    if not id then
        player.roles, player.rolesAt = false, os.time()
        return false
    end

    local p = promise.new()
    Discord.member(id, function(roles) p:resolve(roles) end)
    local roles = Citizen.Await(p)
    if roles ~= nil then player.roles, player.rolesAt = roles, os.time() end
    return player.roles
end

function Players.forget(src)
    cache[tonumber(src)] = nil
end

AddEventHandler('esx:playerLoaded', function(src)
    if not DB.ready then return end
    CreateThread(function()
        Players.get(src)
        Players.roles(src)
    end)
end)

AddEventHandler('playerDropped', function()
    Players.forget(source)
end)

DB.onReady(function()
    for _, src in ipairs(GetPlayers()) do
        Players.get(src)
    end
end)
