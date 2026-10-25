Log = {}

local colors = { info = '7', warn = '3', error = '1' }

-- บันทึก log ลง DB และพิมพ์ลง console ถ้าเป็น error หรือเปิด debug
function Log.write(level, source, message, data)
    if level ~= 'info' or Config.Debug then
        print(('^%s[Rxy_Store]^7 %s^7'):format(colors[level] or '7', message))
    end

    if not DB.ready then return end

    MySQL.insert(DB.sql('INSERT INTO {logs} (at, level, source, message, data) VALUES (?, ?, ?, ?, ?)'), {
        DB.now(),
        level,
        source,
        message,
        data and json.encode(data) or nil,
    })
end

-- log ทั่วไป
function Log.info(source, message, data)
    Log.write('info', source, message, data)
end

-- log เตือน
function Log.warn(source, message, data)
    Log.write('warn', source, message, data)
end

-- log error
function Log.error(source, message, data)
    Log.write('error', source, message, data)
end
