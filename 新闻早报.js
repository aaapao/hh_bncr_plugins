/**
 * @author 小寒寒
 * @name 新闻早报
 * @origin 小寒寒
 * @version 1.0.1
 * @description 新闻早报，自行更改群号
 * @rule ^新闻早报$
 * @priority 1000
 * @admin false
 * @cron 0 0 7 * * *
 * @disable false
 * */
const img = 'https://api.caonm.net/api/60/index';
const config = [
    {
        userId: 0,
        groupId: 43205083856,
        platform: 'wxQianxun'
    },
    {
        userId: 0,
        groupId: 368256161,
        platform: 'qq'
    },
    {
        userId: 'jun812148374',
        groupId: 0,
        platform: 'wxQianxun'
    }
]
module.exports = async s => {
    if (await s.getFrom() == 'cron') {
        for (let item of config || []) {
            await push(item.userId, item.groupId, item.platform);
        }
    }
    else {
        await s.reply({
            path: img,
            type: 'image'
        })
    }

    async function push(userId, groupId, platform) {
        await sysMethod.push({
            platform: platform,
            userId: userId,
            groupId: groupId,
            path: img,
            type: 'image'
        });
    }
}