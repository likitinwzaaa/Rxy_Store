Bridge = {}

local ESX = nil

local function core()
    if ESX then return ESX end
    if GetResourceState('es_extended') ~= 'started' then return nil end
    ESX = exports['es_extended']:getSharedObject()
    return ESX
end

function Bridge.player(src)
    local esx = core()
    return esx and esx.GetPlayerFromId(src) or nil
end

function Bridge.name(src)
    local xPlayer = Bridge.player(src)
    if xPlayer then return xPlayer.getName() end
    return GetPlayerName(src)
end

function Bridge.job(src)
    local xPlayer = Bridge.player(src)
    if not xPlayer then return nil, 0 end
    local job = xPlayer.getJob()
    return job.name, tonumber(job.grade) or 0
end

function Bridge.notify(src, message)
    TriggerClientEvent('esx:showNotification', src, message)
end
