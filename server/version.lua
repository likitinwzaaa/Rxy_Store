local REPO = 'likitinwzaaa/Rxy_Store'
local CHECK_EVERY = 6 * 60 * 60 * 1000
local SECURITY_TAG = '[security]'

local current = GetResourceMetadata(GetCurrentResourceName(), 'version', 0) or '0.0.0'
local lastTold = nil

-- พิมพ์ลง console พร้อมสี
local function log(color, msg)
    print(('^%s[Rxy_Store]^7 %s^7'):format(color, msg))
end

-- แปลง "v1.2.3" เป็น { 1, 2, 3 }
local function parse(v)
    local a, b, c = tostring(v):match('^v?(%d+)%.(%d+)%.(%d+)')
    if not a then return nil end
    return { tonumber(a), tonumber(b), tonumber(c) }
end

-- a ใหม่กว่า b ไหม
local function isNewer(a, b)
    for i = 1, 3 do
        if a[i] ~= b[i] then return a[i] > b[i] end
    end
    return false
end

-- ตัดโค้ดสีกับ \r ออกจากข้อความ
local function clean(s)
    return (tostring(s or ''):gsub('%^', ''):gsub('\r', ''))
end

-- พิมพ์ชื่อ รายละเอียด และลิงก์ของ release
local function printNotes(release)
    local title = clean(release.name):gsub('%[[Ss][Ee][Cc][Uu][Rr][Ii][Tt][Yy]%]%s*', '')
    if title ~= '' then log('7', title) end

    local shown = 0
    for line in clean(release.body):gmatch('[^\n]+') do
        line = line:match('^%s*(.-)%s*$')
        if line ~= '' then
            print('    ' .. line)
            shown = shown + 1
            if shown >= 6 then
                print('    ...')
                break
            end
        end
    end

    log('7', release.html_url or ('https://github.com/%s/releases'):format(REPO))
end

-- เช็คเวอร์ชันกับ GitHub Releases
local function check(manual)
    local mine = parse(current)
    if not mine then
        log('3', ('อ่าน version ใน fxmanifest ไม่ออก (%s) ข้ามการเช็คเวอร์ชัน'):format(current))
        return
    end

    local url = ('https://api.github.com/repos/%s/releases?per_page=20'):format(REPO)
    PerformHttpRequest(url, function(status, body)
        if status ~= 200 or not body then
            if manual or lastTold == nil then
                log('3', ('เช็คเวอร์ชันไม่ได้ (HTTP %s) ไม่เป็นไร ร้านใช้ได้ปกติ'):format(status))
            end
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
            if manual or lastTold == nil then
                log('2', ('เป็นเวอร์ชันล่าสุดแล้ว (%s)'):format(current))
            end
            lastTold = lastTold or false
            return
        end

        if not Config.UpdateCheck and not security then return end
        if not manual and not security and lastTold == newest.tag_name then return end
        lastTold = newest.tag_name

        if security then
            log('1', ('มีอัปเดตที่แก้ช่องโหว่ %s (ตอนนี้ %s) ควรอัปเดตทันที'):format(newest.tag_name, current))
        else
            log('3', ('มีเวอร์ชันใหม่ %s (ตอนนี้ %s)'):format(newest.tag_name, current))
        end
        printNotes(newest)
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
