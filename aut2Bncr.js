/**
 * @author 小寒寒
 * @name aut数据转换
 * @origin 小寒寒
 * @version 1.0.0
 * @description autMan的PinDB数据转换至Bncr
 * @rule ^aut数据转换$
 * @admin true
 * @public false
 * @priority 1000
 */

//插件入口
module.exports = async s => {

    /* 转换数据配置 下面的数据换成你自己的 */
    const autPinDbToBncr = {
        pinWX: 'wxQianxun', // autMan pinDB wx平台要转成的bncr平台
        pinQQ: 'qq',        // autMan pinDB qq平台要转成bncr平台
        pinTB: 'tgBot',     // autMan pinDB tg机器人要转成bncr平台
        pinTG: 'pgm'   // autMan pinDB tg客户端要转成bncr平台
    };


    /* 迁移数据配置文件 */
    /* autMan发送导出数据后，把文件移动到BncrData/public/目录下 */
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), `BncrData/public/sets.conf`);
    let fileExists = fs.existsSync(file);
    if (fileExists) {
        console.log("检测到sets.conf文件，载入...");
        await s.reply(`‘确认’转换数据？`);
        let input = await s.waitInput(() => { }, 60);
        if (!input || input.getMsg() !== '确认') return s.reply('已取消转换');
        let sets = fs.readFileSync(file, 'utf-8');
        let lines = sets.split(/\r?\n/);
        const pinDB = new BncrDB('pinDB');
        for (let t of lines || []) {
            //console.log(t);
            let keys = t.split(' ');
            if (autPinDbToBncr[keys[1]]) {
                let k = `${autPinDbToBncr[keys[1]]}:${keys[3]}`;
                let v = await pinDB.get(k);
                if (v) {
                    if (v.Pin.includes(keys[2])) continue;
                    v.Pin.push(keys[2]);
                }
                else {
                    v = {
                        Pin: [keys[2]],
                        Form: autPinDbToBncr[keys[1]],
                        ID: keys[3],
                        Name: ""
                    }
                }
                console.log(k, v);
                await pinDB.set(k, v);
            }
        }
        return await s.reply('转换完成');
    }
    else {
        return await s.reply('sets.conf文件不存在');
    }
};
