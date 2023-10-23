/**
 * @author 小寒寒
 * @name 青龙通知接口
 * @origin 小寒寒
 * @version 1.0.9
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
 * 1.0.8 垃圾或领完只根据ck1的判断来标记，减少标记错误的可能性，新增仅需执行一次的活动标记
 * 1.0.9 增加M粉丝互动定时
 */

// 指定标题推送
const push1 = {
    platform: 'wxQianxun', // 平台
    groupId: 49230877656, // 群号
    notify: true // 通知开关
}
const title1 = ['东东农场', '京东价保', '互动消息检查',
    'M银行卡支付有礼', 'M农场自动化',
    '京东试用待领取物品通知',
    '牛牛乐园合成',
    'M京东签到',
    '东东农场日常任务',
    '京东调研问卷',
    '京东白嫖提醒',
    '京东资产统计cookie已失效',
    // '京东CK检测',
    // 'WSKEY转换',
]

// 豆豆通知
const push2 = {
    platform: 'qq', // 平台
    userId: 812148374, // 个人
    notify: true // 通知开关
}

//青龙全部通知
const push3 = {
    platform: 'tgBot', // 平台
    groupId: -1001805030658, // 群号
    notify: true // 通知开关
}

// 仅需执行一次的活动标记，如需再次运行请使用Spy立即运行命令
const onlyTitles = ['M试用有礼', 'M邀请有礼WX', 'M邀请有礼JOY', 'M邀请有礼JINGGENG', 'M邀请有礼INTERACT'];

// SpyIsValid相关功能，默认开启
const spyIsValidEnable = true;

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
        if (title1.includes(title) && push1.notify) {
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
            if (push2.notify) {
                await sysMethod.push({
                    platform: push2.platform, // 平台
                    userId: push2.userId, // 个人id
                    msg: `${title}\n\n${message}`,
                    type: 'text'
                });
            }

            
        }

        if (message.includes('export ') && title[0] == 'M' && spyIsValidEnable) {
            let exptPattern = /export \S+=\"\S+\"/;
            let expt = exptPattern.exec(message)?.toString();

            let url = /https:\/\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\*\+,%;\=]*/.exec(expt)?.toString();
            if (url) {
                let activityId = getQueryString(url, 'activityId') || getQueryString(url, 'id')
                    || getQueryString(url, 'giftId') || getQueryString(url, 'actId')
                    || getQueryString(url, 'code')
                    || getQueryString(url, 'a');
                if (activityId) {
                    message += `\n活动ID：${activityId}`
                    let actCron = await SpyIsValid.get(activityId);
                    const timer_before = await SpyIsValid.get('timer_before');
                    if (title == 'M购物车锦鲤' && /已经开奖/.test(message)) {
                        await SpyIsValid.set(activityId, '已经开奖');
                        message += `\n\nBncr已标记：已经开奖`;
                    }
                    else if (/【[\S]+1】\S*(活动已过期|活动已结束|活动已经结束|商家token过期|超出活动计划时间)/.test(message)) {
                        await SpyIsValid.set(activityId, '活动已结束');
                        message += `\n\nBncr已标记：活动已结束`;
                    }
                    else if (/【[\S]+1】\S*(垃圾或领完|垃圾活动|才能参与抽奖)/.test(message)) {
                        await SpyIsValid.set(activityId, '垃圾或领完');
                        message += `\n\nBncr已标记：垃圾或领完`;
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
                    else if (/【[\S]+1】\S*兑\d:false/.test(message) && title == 'M粉丝互动') {
                        if (!actCron) {
                            let startTime = dayjs().startOf('day').add(1, 'day').subtract(timer_before, 'second');
                            let cron = startTime.format('s m H D M *');
                            console.log(`spy定时插队 ${cron} ${expt}`);
                            await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                            await SpyIsValid.set(activityId, startTime['$d'].getTime());
                            message += '\n\nBncr设置定时：' + cron;
                        }
                        else {
                            message += '\n\nBncr已定时过了。';
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
                        message += `\n\nBncr已标记：已经组满`;
                    }
                    else if (onlyTitles.includes(title)) { // 仅需执行一次的活动标记
                        await SpyIsValid.set(activityId, `${title}仅执行一次`);
                        message += `\n\nBncr已标记：${title}仅执行一次`;
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
        if (push3.notify) {
            await sysMethod.push({
                platform: push3.platform,
                groupId: push3.groupId, // tg青龙日志群
                msg: `${title}\n\n${message}`,
                type: 'text'
            });
        }

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