/**
 * @author 小寒寒
 * @name 删除指定定时任务
 * @origin 小寒寒
 * @version 1.0.0
 * @description 根据activityId删除指定所有定时任务，用于清理指定签到 
 * @rule ^删除指定定时任务 ([a-zA-Z0-9]+)$
 * @admin true
 * @public false
 * @priority 1000
 */

//插件入口
const SpyCronDB = new BncrDB('SpyCronDB');
module.exports = async s => {
    const activityId = s.param(1);
    console.log(activityId);
    const keys = await SpyCronDB.keys();
    let i = 0;
    for (let key of keys || []) {
        let value = await SpyCronDB.get(key);
        if (value.strMsg.indexOf(activityId) > -1) {
            await s.reply(`删除定时任务：${value.strMsg}`);
            await SpyCronDB.del(key);
            i++;
        }
    }
    if (i > 0) {
        await s.reply(`总共删除${i}个定时，正在重启...`);
        sysMethod.inline('重启')
    }
    else {
        await s.reply(`没有找到${activityId}的定时任务。`)
    }
}
