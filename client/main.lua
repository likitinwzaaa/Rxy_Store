local isOpen = false
local themeSent = false

-- เปิด/ปิดหน้าร้าน ส่ง admin = true ถ้าจะเปิดหน้าแอดมิน
local function setOpen(state, admin)
    if isOpen == state then return end
    isOpen = state

    if state and not themeSent then
        SendNUIMessage({ action = 'setTheme', data = Config.Theme })
        themeSent = true
    end

    if state then
        SendNUIMessage({ action = 'setAdmin', data = admin == true })
    end

    SetNuiFocus(state, state)
    SendNUIMessage({ action = 'setVisible', data = state })
end

RegisterCommand(Config.Command, function()
    setOpen(not isOpen)
end, false)

RegisterCommand(Config.AdminCommand, function()
    setOpen(true, true)
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
