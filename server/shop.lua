local function groups()
    local source = Config.CategoryAccess == 'role' and (Config.Discord.Roles or {}) or (Config.Jobs or {})
    local list = {}
    for id, name in pairs(source) do
        list[#list + 1] = { id = tostring(id), name = tostring(name) }
    end
    table.sort(list, function(a, b) return a.name < b.name end)
    return list
end

Requests.on('shop:open', { limit = 5, per = 10 }, function(src, payload)
    local player = Players.get(src)
    if not player then return nil, 'error' end

    local visible, vis = Catalog.visible(src)
    local data = {
        version = Catalog.version,
        vis = vis,
        stock = Catalog.stock(visible),
        bought = Catalog.bought(player.id),
        settings = Settings.public(),
        player = {
            name = player.name,
            mismatch = player.mismatch,
        },
    }
    if payload.version ~= Catalog.version or payload.vis ~= vis then
        data.catalog = Catalog.forPlayer(visible)
    end
    return data
end)

Requests.on('cart:quote', { limit = 20, per = 10 }, function(src, payload)
    local quote, err = Pricing.quote(src, payload)
    if not quote then return nil, err end
    quote.satang = nil
    return quote
end)

Requests.on('player:find', { limit = 15, per = 10 }, function(src, payload)
    local target = tonumber(payload.id)
    if not target or target % 1 ~= 0 or target == src or not GetPlayerName(target) then return nil, 'not_found' end
    return { id = target, name = Bridge.name(target) }
end)

Requests.on('admin:check', { limit = 5, per = 10 }, function(src)
    if not Perms.isAdmin(src, 300) then
        Perms.denied(src)
        Bridge.notify(src, 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้')
        return nil, 'forbidden'
    end
    return { dev = Perms.isDev(src) }
end)

Requests.on('admin:load', { admin = true, limit = 5, per = 10 }, function(src)
    local roleMode = Config.CategoryAccess == 'role'
    local categories, products, banners, codes = {}, {}, {}, {}

    for _, c in ipairs(Catalog.categories) do
        categories[#categories + 1] = {
            id = c.id,
            name = c.name,
            icon = c.icon,
            enabled = c.enabled,
            groups = roleMode and c.roles or c.jobs,
            hideEmpty = c.hideEmpty,
            rev = c.rev,
        }
    end

    for _, p in ipairs(Catalog.products) do
        products[#products + 1] = {
            id = p.id,
            name = p.name,
            category = p.category,
            description = p.description,
            image = p.image,
            price = p.price / 100,
            salePrice = p.salePrice and p.salePrice / 100 or nil,
            saleEndsAt = p.saleEndsAt,
            stock = p.stock,
            limit = p.limit,
            limitPeriod = p.limitPeriod,
            rewards = p.rewards,
            featured = p.featured,
            startsAt = p.startsAt,
            hideWhenBlocked = p.hideWhenBlocked,
            enabled = p.enabled,
            rev = p.rev,
        }
    end

    for _, b in ipairs(Catalog.banners) do
        banners[#banners + 1] = {
            id = b.id,
            label = b.label,
            image = b.image,
            link = b.link,
            startsAt = b.startsAt,
            endsAt = b.endsAt,
            enabled = b.enabled,
            rev = b.rev,
        }
    end

    for _, c in pairs(Catalog.codes) do
        codes[#codes + 1] = {
            code = c.code,
            kind = c.kind,
            value = c.kind == 'fixed' and c.value / 100 or c.value,
            limit = c.limit,
            perPlayer = c.perPlayer,
            used = c.used,
            startsAt = c.startsAt,
            endsAt = c.endsAt,
            enabled = c.enabled,
            allowOnSale = c.allowOnSale,
            minTotal = c.minTotal and c.minTotal / 100 or nil,
            maxOff = c.maxOff and c.maxOff / 100 or nil,
            onlyCategories = c.onlyCategories,
            onlyProducts = c.onlyProducts,
            rev = c.rev,
        }
    end
    table.sort(codes, function(a, b) return a.code < b.code end)

    return {
        dev = Perms.isDev(src),
        categories = categories,
        products = products,
        banners = banners,
        codes = codes,
        groups = groups(),
        settings = {
            name = Settings.get('name'),
            theme = Settings.get('theme'),
            openKey = Config.OpenKey,
            bannerSeconds = Settings.get('bannerSeconds'),
            locked = Settings.locked(),
        },
        imageHosts = Config.ImageHosts or {},
    }
end)
