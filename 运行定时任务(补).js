/**
 * @author 小寒寒
 * @name 运行定时任务(补)
 * @origin 小寒寒
 * @version 1.0.0
 * @description 运行定时任务(补) 命令： 补定时 0 0 0 5 7 *
 * @rule ^补定时 ([\,\d\w\ *-]+\*)$
 * @admin true
 * @public false
 * @priority 999999
 */

//插件入口
const SpyCronDB = new BncrDB('SpyCronDB');
module.exports = async s => {
    const schedule = s.param(1);
    await s.reply(schedule);
    const keys = await SpyCronDB.keys();
    for (let key of keys || []) {
        let value = await SpyCronDB.get(key);
        if (value.schedule == schedule) {
            await s.inlineSugar(value.strMsg);
            await sysMethod.sleep(1);
        }
    }
    await s.reply(`执行完成，手动发送【清空过期定时任务】。`);
}