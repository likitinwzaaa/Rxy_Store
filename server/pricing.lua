Pricing = {}

local MAX_LINES = 30
local MAX_QTY = 99

local function contains(list, value)
    for _, v in ipairs(list or {}) do
        if v == value then return true end
    end
    return false
end

local function baht(satang)
    return satang / 100
end

local function bahtText(satang)
    local whole = satang // 100
    local text = tostring(whole):reverse():gsub('(%d%d%d)', '%1,'):reverse():gsub('^,', '')
    if satang % 100 ~= 0 then text = text .. ('.%02d'):format(satang % 100) end
    return '฿' .. text
end

local function cleanLines(input)
    if type(input) ~= 'table' then return nil end
    local lines, seen = {}, {}
    for i, line in ipairs(input) do
        if i > MAX_LINES then return nil end
        if type(line) ~= 'table' or type(line.id) ~= 'string' or #line.id > 48 then return nil end
        local qty = tonumber(line.qty)
        if not qty or qty < 1 or qty > MAX_QTY or qty % 1 ~= 0 then return nil end
        if not seen[line.id] then
            seen[line.id] = true
            lines[#lines + 1] = { id = line.id, qty = qty }
        end
    end
    return lines
end

local function checkCode(code, player, eligible, subtotal, now)
    if not code then return 0 end
    if code.enabled == false then return nil, 'ไม่มีโค้ดนี้' end
    if code.startsAt and code.startsAt > now then return nil, 'โค้ดนี้ยังใช้ไม่ได้' end
    if code.endsAt and code.endsAt <= now then return nil, 'โค้ดนี้หมดอายุแล้ว' end
    if code.limit and code.used >= code.limit then return nil, 'โค้ดนี้ถูกใช้ครบแล้ว' end
    if code.minTotal and subtotal < code.minTotal then
        return nil, 'ต้องซื้อขั้นต่ำ ' .. bahtText(code.minTotal)
    end
    if eligible <= 0 then return nil, 'โค้ดนี้ใช้กับของในตะกร้าไม่ได้' end

    if code.perPlayer then
        local used = MySQL.scalar.await(
            DB.sql("SELECT COUNT(*) FROM {orders} WHERE player_id = ? AND code = ? AND status = 'paid'"),
            { player.id, code.code }
        )
        if (tonumber(used) or 0) > 0 then return nil, 'คุณใช้โค้ดนี้ไปแล้ว' end
    end

    local off
    if code.kind == 'percent' then
        off = math.floor(eligible * code.value / 100)
    else
        off = math.min(code.value, eligible)
    end
    if code.maxOff then off = math.min(off, code.maxOff) end
    return off
end

local function bestTier(topup)
    local best
    for _, tier in ipairs(Catalog.tiers) do
        if tier.enabled and tier.minTotal <= topup and (not best or tier.minTotal >= best.minTotal) then best = tier end
    end
    return best
end

function Pricing.quote(src, payload)
    local player = Players.get(src)
    if not player then return nil, 'error' end

    local lines = cleanLines(payload.lines)
    if not lines then return nil, 'bad' end

    local visible = Catalog.visible(src)
    local bought = Catalog.bought(player.id)
    local now = os.time() * 1000
    local out, issues = {}, {}
    local subtotal, eligible = 0, 0

    local codeText = type(payload.code) == 'string' and payload.code:upper():sub(1, 16) or nil
    if codeText == '' then codeText = nil end
    local code = codeText and Catalog.codes[codeText] or nil

    for _, line in ipairs(lines) do
        local p = Catalog.byId[line.id]
        if not Catalog.isOnSale(p, visible) then
            issues[#issues + 1] = { id = line.id, reason = 'ไม่มีสินค้านี้แล้ว', max = 0 }
        elseif p.startsAt and p.startsAt > now then
            issues[#issues + 1] = { id = line.id, reason = 'ยังไม่เปิดขาย', max = 0 }
        else
            local max = MAX_QTY
            if p.stock then max = math.min(max, p.stock) end
            if p.limit then max = math.min(max, p.limit - (bought[p.id] or 0)) end
            max = math.max(max, 0)

            if max == 0 then
                issues[#issues + 1] = { id = line.id, reason = p.stock == 0 and 'หมดแล้ว' or 'ซื้อครบแล้ว', max = 0 }
            else
                local qty = line.qty
                if qty > max then
                    issues[#issues + 1] = { id = line.id, reason = ('ซื้อได้อีก %d ชิ้น'):format(max), max = max }
                    qty = max
                end
                local price, onSale = Catalog.price(p, now)
                out[#out + 1] = { id = p.id, qty = qty, price = baht(price) }
                subtotal = subtotal + price * qty

                if code then
                    local fits = (#code.onlyProducts == 0 or contains(code.onlyProducts, p.id))
                        and (#code.onlyCategories == 0 or contains(code.onlyCategories, p.category))
                        and (code.allowOnSale or not onSale)
                    if fits then eligible = eligible + price * qty end
                end
            end
        end
    end

    local codeOff, codeError = 0, nil
    if codeText and not code then
        codeError = 'ไม่มีโค้ดนี้'
    elseif code then
        local off, err = checkCode(code, player, eligible, subtotal, now)
        if off then codeOff = off else codeError = err end
    end

    local tierOff = 0
    local tier = bestTier(player.topup)
    if tier and tier.discount > 0 then
        tierOff = math.floor(subtotal * tier.discount / 100)
        if codeOff > 0 and not tier.stack then
            if tierOff > codeOff then codeOff = 0 else tierOff = 0 end
        end
    end

    local total = math.max(subtotal - codeOff - tierOff, 0)

    return {
        lines = out,
        issues = issues,
        subtotal = baht(subtotal),
        codeOff = baht(codeOff),
        tierOff = baht(tierOff),
        total = baht(total),
        code = (code and not codeError) and code.code or nil,
        codeError = codeError,
        tier = tierOff > 0 and tier.name or nil,
        satang = { subtotal = subtotal, codeOff = codeOff, tierOff = tierOff, total = total },
    }
end
