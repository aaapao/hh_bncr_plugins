/**
 * @author 小寒寒
 * @name 青龙通知接口
 * @origin 小寒寒
 * @version 1.0.7
 * @description 青龙通知接口，根据通知标记活动，适配于麦基EVE库，搭配库里SpyIsValid使用，需配置对接token，set SpyIsValid ql_token xxxx，自行需要修改推送群号 不能其它通知接口插件共用
 * @public false
 * @priority 99
 * @disable false
 * @service true
 * 
 * 
 * 1.0.4 适配积分兑换，增加更多垃圾活动标记，优化日期处理
 * 1.0.5 修复bug
 * 1.0.6 优化及调整
 * 1.0.7 协助作者收集高质量活动店铺ID 80-94
 */

// 指定标题推送
const push1 = {
    platform: 'wxQianxun', // 平台
    groupId: 49230877656, // 群号
}
const title1 = ['东东农场', '京东价保', '互动消息检查',
    'M银行卡支付有礼', '京东CK检测', 'M农场自动化',
    '京东试用待领取物品通知', 'WSKEY转换',
    '牛牛乐园合成',
    'M京东签到',
    '东东农场日常任务'
]

// 豆豆通知
const push2 = {
    platform: 'wxQianxun', // 平台
    userId: 'jun812148374', // 群号
}

//青龙全部通知
const push3 = {
    platform: 'tgBot', // 平台
    groupId: -1001805030658, // 群号
}

const SpyIsValid = new BncrDB('SpyIsValid');
const dayjs = require('dayjs');
const request = require('util').promisify(require('request'));
/* post接口 */
router.post('/api/qinglongMessage', async (req, res) => {
    try {
        const setToken = await SpyIsValid.get('ql_token', null);
        if (!setToken) return res.send({ code: 401, data: '', msg: '未设置token，拒绝访问' });
        let { title, message, token } = req?.body;
        if (token !== setToken) return res.send({ code: 400, data: '', msg: '青龙BncrToken与Bncr setToken不一致' });
        // /* 标题 */
        // console.log('title', title);
        // /* 推送日志 */
        // console.log('message', message);
        //关键活动推韭菜群
        if (title1.includes(title)) {
            await sysMethod.push({
                platform: push1.platform, // 平台
                groupId: push1.groupId, // 群号
                msg: `${title}\n\n${message}`,
                type: 'text'
            });
        }
        //订阅变更和豆豆推个人微信
        if (/(新增任务|删除任务)/.test(title)
            || (/\d+】\S*\d+京豆/.test(message) && title != 'M签到有礼' && title != 'M京东签到')
            || (/天,\d+京豆/.test(message) && title == 'M签到有礼')
            || (/,已填地址/.test(message) && title != 'M试用有礼' && !/(明日再来|未到每天兑换时间)/.test(message))
        ) {
            await sysMethod.push({
                platform: push2.platform, // 平台
                userId: push2.userId, // 个人id
                msg: `${title}\n\n${message}`,
                type: 'text'
            });

            // 协助作者收集高质量活动店铺ID
            try {
                let shopInfo = /店铺信息:[\d]+_[\d]+/.exec(message)?.toString() || '';
                // console.log(shopInfo);
                if (shopInfo) {
                    let shopId = shopInfo.split(':')[1];
                    /** Code Encryption Block[419fd178b7a37c9eae7b7426c4a04203c90f097f761598b157b007255f983ec5b7989e0d1f6512c02a61c55314733c8762798fad21dd0f2c79bd82ec3ec11145d92cdb7775649987daf569d41a6c9c91f1c3dd85cbbecbabf55dfcc44ace4b99150952dda785b4c6aaf2a9286dced20b704e3cfee00cdf4a8218092119e33d097124b62866be8ee265bc0d49d1a5a2948e258dc0bd397fed47eee22c39552d723ff633ff7fcbe8d4c84952a1203f62ba] */
                    message = message.replace(shopInfo, shopInfo + '(店铺ID已收集)')
                }
            }
            catch(e){ 
                console.log(e)
            }
        }

        if (message.includes('export ') && title[0] == 'M') {
            let exptPattern = /export \S+=\"\S+\"/;
            let expt = exptPattern.exec(message)?.toString();

            let url = /https:\/\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\*\+,%;\=]*/.exec(expt)?.toString();
            if (url) {
                let activityId = getQueryString(url, 'activityId') || getQueryString(url, 'id') || getQueryString(url, 'giftId') || getQueryString(url, 'actId');
                // console.log(activityId);
                if (activityId) {
                    let actCron = await SpyIsValid.get(activityId);
                    const timer_before = await SpyIsValid.get('timer_before');
                    if (title == 'M购物车锦鲤' && /已经开奖/.test(message)) {
                        await SpyIsValid.set(activityId, '已经开奖');
                        message += '\n\nBncr已标记：已经开奖';
                    }
                    else if (/(活动已过期|活动已结束|活动已经结束|商家token过期)/.test(message)) {
                        await SpyIsValid.set(activityId, '活动已结束');
                        message += '\n\nBncr已标记：活动已结束';
                    }
                    else if (/(垃圾或领完|垃圾活动|达到\d+元才能参与抽奖)/.test(message)) {
                        await SpyIsValid.set(activityId, '垃圾或领完');
                        message += '\n\nBncr已标记：垃圾或领完';
                    }
                    else if (/未开始/.test(message)) {
                        let datePattern = /\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}\s?(至|\-)/;
                        let rlt = datePattern.exec(message)?.toString();
                        if (rlt) {
                            let startTime = dayjs(rlt.slice(0, 19)).subtract(timer_before, 'second');
                            let cron = startTime.format('s m H D M *');
                            if (!actCron) {
                                console.log(`spy定时插队 ${cron} ${expt}`);
                                await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                                await SpyIsValid.set(activityId, startTime['$d'].getTime());
                                message += '\n\nBncr设置定时：' + cron;
                            }
                            else {
                                message += '\n\nBncr已定时过了。';
                            }
                        }
                    }
                    else if (title == 'M购物车锦鲤' && /开奖时间:/.test(message)) {
                        let datePattern = /开奖时间:\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}/;
                        let rlt = datePattern.exec(message)?.toString();
                        if (rlt) {
                            // console.log(rlt.substr(5, 16));
                            // console.log(rlt.substr(5, 16) + ':00');
                            let startTime = dayjs(rlt.substr(5, 16) + ':00').subtract(timer_before, 'second');
                            let cron = startTime.format('s m H D M *');
                            if (!actCron) {
                                console.log(`spy定时插队 ${cron} ${expt}`);
                                await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                                await SpyIsValid.set(activityId, startTime['$d'].getTime());
                                message += '\n\nBncr设置定时：' + cron;
                            }
                            else {
                                message += '\n\nBncr已定时过了。';
                            }
                        }
                    }
                    else if (/已经组满/.test(message) && title == 'M组队瓜分') {
                        await SpyIsValid.set(activityId, '已经组满');
                        message += '\n\nBncr已标记：已经组满';
                    }
                    else if (title == 'M试用有礼') {
                        await SpyIsValid.set(activityId, '已经执行过M试用有礼');
                        message += '\n\nBncr已标记：已经执行过M试用有礼';
                    }
                    // else if (title == 'M积分兑换' && /(明日再来|未到每天兑换时间)/.test(message)) {
                    //     let datePattern = /兑换时间:\d{2}:\d{2}/;
                    //     let rlt = datePattern.exec(message)?.toString();
                    //     let startTime = dayjs().add(1, 'day').startOf('day').subtract(timer_before, 'second');
                    //     // console.log(startTime);
                    //     if (rlt) {
                    //         startTime = dayjs(`${dayjs().format('YYYY-MM-DD')} ${rlt.substr(5, 5)}:00`);
                    //         if (message.includes('请明日再来')) {
                    //             startTime = dayjs(startTime).add(1, 'day');
                    //         }
                    //     }
                    //     startTime = startTime.subtract(timer_before, 'second');
                    //     if (!actCron) {
                    //         let cron = startTime.format('s m H D M *');
                    //         console.log(`spy定时插队 ${cron} ${expt}`);
                    //         await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                    //         await SpyIsValid.set(activityId, startTime['$d'].getTime());
                    //         message += '\n\nBncr设置定时：' + cron;
                    //     }
                    //     else {
                    //         message += '\n\nBncr已定时过了。';
                    //     }
                    // }
                }
            }
        }

        // tg推送全部日志
        await sysMethod.push({
            platform: push3.platform,
            groupId: push3.groupId, // tg青龙日志群
            msg: `${title}\n\n${message}`,
            type: 'text'
        });

        /* 返回结果 */
        return res.send({ code: 200, data: '', msg: 'ok' });
    } catch (e) {
        console.log(e);
        res.send({ code: 400, data: '', msg: '参数有误！' });
    }
});

/* get接口 */
router.get('/api/qinglongMessage', async (req, res) => {
    res.send('Bncr青龙消息通知接口');
});

function getQueryString(url, name) {
    let reg = new RegExp('([?&])' + name + '=([^&]+)');
    let r = url.match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return '';
}