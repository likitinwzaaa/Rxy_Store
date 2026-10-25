Config = {}

Config.OpenKey = 'F5'
Config.Command = 'shop'
Config.AdminCommand = 'shopadmin'

Config.UpdateCheck = true

Config.Debug = false

Config.Backup = {
    AutoClean = true,
    Keep = 3,
}

Config.ShopName = nil

Config.Theme = nil

Config.Discord = {
    GuildId = '',
    AdminRoles = {},
    Roles = {},
}

Config.CategoryAccess = 'job'

Config.Jobs = {
    ['police'] = 'ตำรวจ',
    ['police:2'] = 'ตำรวจ grade 2 ขึ้นไป',
    ['ambulance'] = 'หมอ',
}

Config.ImageHosts = {
    'cdn.discordapp.com',
    'media.discordapp.net',
    'i.imgur.com',
    'r2.fivemanage.com',
}
