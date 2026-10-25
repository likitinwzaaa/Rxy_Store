local isOpen = false
local pending = {}
local nextId = 0

local function setOpen(state, admin)
    if state then
        SendNUIMessage({ action = 'setAdmin', data = admin == true })
    end
    if isOpen == state then return end
    isOpen = state

    SetNuiFocus(state, state)
    SendNUIMessage({ action = 'setVisible', data = state })
end

local function request(name, payload, cb)
    nextId = nextId + 1
    local id = nextId
    pending[id] = cb
    TriggerServerEvent('rxy_store:req', id, name, payload or {})
    SetTimeout(15000, function()
        local waiting = pending[id]
        if waiting then
            pending[id] = nil
            waiting(false, 'timeout')
        end
    end)
end

RegisterNetEvent('rxy_store:res', function(id, ok, data)
    local cb = pending[id]
    if not cb then return end
    pending[id] = nil
    cb(ok, data)
end)

RegisterNUICallback('req', function(data, cb)
    if type(data) ~= 'table' or type(data.name) ~= 'string' then
        cb({ ok = false, error = 'bad' })
        return
    end
    request(data.name, data.payload, function(ok, result)
        if ok then
            cb({ ok = true, data = result })
        else
            cb({ ok = false, error = result })
        end
    end)
end)

RegisterNUICallback('checkModels', function(data, cb)
    local bad = {}
    if type(data) == 'table' and type(data.models) == 'table' then
        for i, model in ipairs(data.models) do
            if i > 20 then break end
            local hash = type(model) == 'string' and joaat(model) or 0
            if not IsModelInCdimage(hash) or not IsModelAVehicle(hash) then bad[#bad + 1] = tostring(model) end
        end
    end
    cb({ bad = bad })
end)

RegisterCommand(Config.Command, function()
    setOpen(not isOpen)
end, false)

RegisterCommand(Config.AdminCommand, function()
    request('admin:check', {}, function(ok)
        if ok then setOpen(true, true) end
    end)
end, false)

RegisterKeyMapping(Config.Command, 'เปิดร้านค้า', 'keyboard', Config.OpenKey)

RegisterNUICallback('close', function(_, cb)
    setOpen(false)
    cb('ok')
end)

exports('open', function() setOpen(true) end)
exports('close', function() setOpen(false) end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if isOpen then SetNuiFocus(false, false) end
end)
