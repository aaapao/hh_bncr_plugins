/**
 * @author 小寒寒
 * @name 新闻早报
 * @origin 小寒寒
 * @version 1.0.0
 * @description 新闻早报，自行更改群号
 * @rule ^新闻早报$
 * @priority 1000
 * @admin false
 * @cron 0 0 7 * * *
 * @disable false
 * */

module.exports = async s => {
    if (await s.getFrom() == 'cron') {
        await sysMethod.push({
            platform: 'wxQianxun',
            groupId: 43205083856,
            path: 'https://api.caonm.net/api/60/index',
            type: 'image'
        })
    }
    else {
        await s.reply({
            path: 'https://api.caonm.net/api/60/index',
            type: 'image'
        })
    }
}