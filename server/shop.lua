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
        return nil, 'forbidden'
    end
    return { dev = Perms.isDev(src) }
end)
