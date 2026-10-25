Perms = {}

local WINDOW = 600
local tries = {}

function Perms.isDev(src)
    return IsPlayerAceAllowed(tostring(src), 'rxystore.dev')
end

function Perms.isAdmin(src, maxAge)
    if Perms.isDev(src) or IsPlayerAceAllowed(tostring(src), 'rxystore.admin') then return true end

    local roles = Players.roles(src, maxAge)
    if type(roles) ~= 'table' then return false end

    for _, role in ipairs(roles) do
        for _, allowed in ipairs(Config.Discord.AdminRoles or {}) do
            if tostring(role) == tostring(allowed) then return true end
        end
    end
    return false
end

function Perms.denied(src)
    local now = os.time()
    local entry = tries[src] or { times = {}, reported = 0 }
    tries[src] = entry

    local kept = {}
    for _, t in ipairs(entry.times) do
        if now - t < WINDOW then kept[#kept + 1] = t end
    end
    kept[#kept + 1] = now
    entry.times = kept

    if #kept > 3 and now - entry.reported >= WINDOW then
        entry.reported = now
        local player = Players.get(src)
        Discord.log('admin', 'มีคนพยายามเปิดหน้าแอดมิน', {
            ('**ชื่อ** %s (ID %s)'):format(Discord.escape(player and player.name or GetPlayerName(src)), src),
            ('**license** %s'):format(player and player.license or '-'),
            ('**discord** %s'):format(player and player.ids.discord or '-'),
            ('ลอง %d ครั้งใน 10 นาที'):format(#kept),
        }, 0xE74C3C)
        Log.warn('perms', ('%s tried to open the admin panel without permission'):format(GetPlayerName(src) or src))
    end
end

AddEventHandler('playerDropped', function()
    tries[source] = nil
end)
