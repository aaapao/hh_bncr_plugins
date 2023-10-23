/**
 * @name SpyIsValid
 * @version v2.3.3
 * @author 小寒寒
 * @origin 红灯区
 * @create_at 2023-05-27 11:12:09
 * @description 判断是否有效线报，及未开始活动和签到定时。
 * @module true
 * @public false
 */
/* 
基于Bncr Spy的验证插件

v1.0.0
    原版程序
v2.0.0
    判断线报是否有效，以及大部分活动奖励和时间解析，支持未开始活动定时，结束活动不运行。
    需覆盖替换'红灯区/mod'下同名js文件。
v2.0.1
    增加所需依赖自动安装
v2.0.2
    增加更新日志，修复几个小bug
v2.0.3
    跳过部分活动飞外太空的判断，继续执行。
    重复定时优化
v2.0.4
    修复日历签到定时不完全的问题，并更佳精准
    优化每日抢，开始抢超过前后半小时不执行，并且定时只会今天或明天
    修复部分lzjk活动解析有误的问题
v2.0.5
    修复lzjk幸运抽奖活动判断是否有效，目前还是存在限流问题
    修复店铺礼包分享活动解析有误
    优化判断定时是否重复
v2.0.6
    SPY1.1.7的定时插队会通过该插件验证会导致重复定时任务无法执行，故绕过定时插队执行判断，避免无法执行
v2.0.7
    部分提示优化
v2.0.8
    调整日历和七日签到非首日也执行但不定时。
    修复日历和七日签到可能存在漏定时的问题。
    增加有效活动及定时日志推送位置set SpyIsValid isPush f:g:m，不设置的话默认tg机器人管理员推送。(某哥们喊了几天了。)
    格式：f:g:m
      f为平台名wxQianxun、qq、tgBot、HumanTG
      g可选groupId、userId，分别对应群和个人
      m为id
    栗子：
      wxQianxun:userID:chao69686   
       ↑推送给wxQianxun平台的chao69686微信号
v2.0.9
    修复cjhy加购未开始没有定时却执行的问题
    调整cjhy加购无豆不执行（原优惠券不执行）
v2.1.0
    调整cjhy加购奖品为优惠券不执行，低于100积分不执行，其余奖品正常执行。
    日历和七日签到定时开关，默认关set SpyIsValid signTimer false/true
    调整日历和七日签到，每天的签到连接追加&day=n防止签到一天后都被清除，n代表签到第几天
    cj组队为积分组队时未开始的线报则不定时只拦截
v2.1.1
    无效活动记录，避免重复解析，减少通知，如需强制执行请使用"spy立即执行"命令方可跳过该模块校验。
v2.1.2
    cj组队和cj每日抢自定义提前多少秒定时，默认不提前：set SpyIsValid timer_before 秒数
    优化cj每日抢定时
    日历签和七日签，最后一天签到定时自定义提前多少秒定时，默认不提前：set SpyIsValid timer_before 秒数
v2.1.3
    修复无线签定时失效问题
v2.1.4
    修复部分情况下检查定时重复报错
    优化部分逻辑，使其cpu占用更少
v2.1.5
    当是有效活动时，增加自定义调用管理员命令 命令格式：xxx export a="b"，其中xx是自定义命令，设置方法：set SpyIsValid custom_export xxxxx
v2.1.6
    修复已知bug，务必更新
v2.1.7
    优化cj每日抢定时及开抢判断
v2.1.8
    关闭LZ相关活动运行（不包括100系列) set SpyIsValid lzkj_stop true
v2.1.9
    关闭LZ相关活动运行开关，增加lzkjdz系列活动
    通过减少数据库读取频率，优化内存占用
v2.2.0
    增加lzkj每日抢活动判断及定时
    优化每日抢定时
v2.2.1
    修复部分活动解析为undefined及加购定时重复url打印
v2.2.2
    通过适配库里的青龙通知接口插件来判断100系列活动有效性
    修复小部分bug
v2.2.3
    修复部分抽奖活动有效性判断有误的bug
v2.2.4
    定时记录和判断是否定时的规则调整
    优化定时性能
v2.2.5
    适配积分兑换，优化日期处理
v2.2.6
    修复bug
v2.2.7
    签到支持自定义定时，签到所需天数达到多少天后不定时，例如set SpyIsValid signTimeDays 7 小于等于7天的定时 
v2.2.8
    增加每日抢定时开关，默认关，set SpyIsValid dayTimer false/true
v2.2.9
    修复bug
v2.3.0
    继续优化
v2.3.1
    修复每日抢定时失效的问题
v2.3.2
    优化每日定时逻辑判断，每日抢增加份数限制
    增加非首日的签到是否执行的开关
    调整无效活动日志推送配置 set SpyIsValid invalid_tips f:g:m
v2.3.3
    修复上版本遗留的bug

变量整理：
         拦截指定活动：set SpyIsValid 活动id 理由               例如：set SpyIsValid 63464093f63348d8bd49c44536001ffe 垃圾或领完 取消拦截则 del SpyIsValid 63464093f63348d8bd49c44536001ffe
     无效活动日志推送：set SpyIsValid invalid_tips f:g:m        无效运行日志输出位置
有效活动及定时日志推送：set SpyIsValid isPush f:g:m             例如：set SpyIsValid isPush wxQianxun:userID:chao69686   
    格式：f:g:m
      f为平台名wxQianxun、qq、tgBot、HumanTG
      g可选groupId、userId，分别对应群和个人
      m为id
日历和七日签到定时开关：set SpyIsValid signTimer false/true     默认关,false
         定时提前时间：set SpyIsValid timer_before 秒数        默认不提前，例如：set SpyIsValid timer_before 3 
       自定义调用变量：set SpyIsValid custom_export xxxxx      命令格式：xxx export a="b" ，其中xx是自定义命令
   关闭LZ相关活动运行：set SpyIsValid lzkj_stop false/true     不包括100系列
     签到所需天数限制：set SpyIsValid signTimeDays 天数        例如：set SpyIsValid signTimeDays 7 小于等于7天的定时 默认无限制
       每日抢定时开关：set SpyIsValid dayTimer false/true      默认关,false
       每日抢数量限制：set SpyIsValid dailyNum 50              默认 10
  非首日的签到是否执行：set SpyIsValid nofisrtSign false/true        默认 true
*/


const request = require('util').promisify(require('request'));
const UA = require('./USER_AGENTS');
const t = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SpyCronDB = new BncrDB('SpyCronDB');
const SpyIsValid = new BncrDB('SpyIsValid');
const QlMod = require('./AmQlMod');
// const SpyConfig = require('./SpyConfig');

/* HideStart */
module.exports = async envObj => {
    // await pushAdmin(config);
    // await pushAdmin('需要判断的变量:', envObj);
    /* 格式为key变量名,val变量值
    {
        key: 'M_WX_POINT_DRAW_URL',
        val: 'https://cjhy-isv.isvjcloud.com/mc/wxPointShopView/pointExgShiWu?giftId=109668ef5a7f4e80ab88fd396087ec04&giftType=3&adsource=cjhdc&venderId=1000003168'
    } 
    */
    /*
    写你的判断逻辑
    */
    // console.info(nowTime);
    let activityId = '';
    await sysMethod.testModule(['dayjs', 'input'], { install: true });
    const dayjs = require('dayjs');
    const timer_before = await SpyIsValid.get('timer_before', 3);
    try {
        // let timer_activityIds = await SpyIsValid.get('timer_activityIds');
        let cmd = `export ${envObj.key}="${envObj.val}"`;
        let url = '';
        if (envObj.val.indexOf('https://') > -1) {
            url = envObj.val;
            activityId = getQueryString(url, 'activityId') || getQueryString(url, 'id')
                || getQueryString(url, 'giftId') || getQueryString(url, 'actId')
                || getQueryString(url, 'code')
                || getQueryString(url, 'a');
        }
        else if (['prodevactCode', 'jd_inv_authorCode', 'jd_prodev_actCode'].includes(envObj.key)) {
            url = 'https://pro.m.jd.com/mall/active/dVF7gQUVKyUcuSsVhuya5d2XD4F/index.html?code=' + envObj.val;
            activityId = envObj.val;
        }
        else {
            activityId = envObj.val;
        }
        // console.log(activityId);
        if (!activityId || !url) {
            return true;
        }
        // console.info(activityId);
        let actReson = await SpyIsValid.get(activityId);
        let nowTime = dayjs()['$d'].getTime();
        if (actReson) {
            if (/^\d{13}$/.test(actReson)) {
                // console.log(actReson, nowTime);
                actReson = Number(actReson);
                if (url.indexOf('signActivity') > -1) {
                    if (nowTime > actReson) {
                        await logPush('已超所需签到日期！\n' + cmd);
                        await SpyIsValid.set(activityId, '已超所需签到日期！');
                        return false;
                    }
                    else {
                        await customInine();
                        return true;
                    }
                }
                else if (url.indexOf('daily') > -1) {
                    if (Math.abs(nowTime - actReson) <= 10 * 1000) {
                        console.log('到点了，执行！', cmd);
                        await customInine();
                        await SpyIsValid.del(activityId);
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else if (nowTime >= actReson) {
                    console.log('到点了，执行！', cmd);
                    await customInine();
                    await SpyIsValid.del(activityId);
                    return true;
                }
                else {
                    await logPush('重复的定时任务！\n' + cmd);
                    return false;
                }
            }
            else if (actReson.indexOf('activityId超过32位') > -1) {
                await SpyIsValid.del(activityId);
            }
            else {
                console.log(actReson, cmd);
                return false;
            }
        }

        // let isCons = await isExistTimer(activityId);
        // if (isCons) {
        //     await sysMethod.testModule(['cron-parser', 'input'], { install: true });
        //     const CronParser = require('cron-parser');
        //     const interval = CronParser.parseExpression(isCons);
        //     const nextTime = interval.next().toISOString();
        //     // console.log(dayjs(nextTime).format('YYYY'));
        //     if (url.indexOf('signActivity') > -1) {
        //         await customInine();
        //         return true;
        //     }
        //     else if (Number(dayjs(nextTime).format('YYYY')) > Number(dayjs().format('YYYY'))) {
        //         timer_activityIds[activityId] = '';
        //         console.log('到点了，执行' + cmd);
        //         await SpyIsValid.set('timer_activityIds', timer_activityIds);
        //         await customInine();
        //         return true;
        //     }
        //     else {
        //         await logPush('重复的定时任务！\n' + url);
        //         return false;
        //     }
        // }
        if (url.indexOf('activityType=') > -1) {
            // console.info('跳过活动检测：\n' + url);
            return true;
        }
        if (url.indexOf('//lzkj-isv.') > -1 || url.indexOf('//lzkjdz-isv.') > -1) {
            const lzkj_stop = await SpyIsValid.get('lzkj_stop', false);
            if (lzkj_stop) {
                console.info('已关闭LZ相关活动运行\n' + url);
                return false;
            }
        }

        let venderId = getQueryString(url, 'venderId') || '';

        switch (envObj.key) {
            case 'prodevactCode':
            case 'jd_inv_authorCode':
            case 'jd_prodev_actCode':
            case 'M_JOY_INVITE_URL':
                let ck = await GetPinCookie();
                let data = await request({
                    url: `https://api.m.jd.com/api?client=&clientVersion=&appid=jdchoujiang_h5&t=${nowTime}&functionId=memberBringActPage&body={%22code%22:%22${activityId}%22}`,
                    method: 'get',
                    headers: {
                        'User-Agent': UA.USER_AGENT(),
                        'Referer': url,
                        'Cookie': ck,
                        'Content-Type': 'application/json'
                    },
                    json: true
                });
                if (!data.body) {
                    console.info('解析失败，请稍后重试！\n' + url);
                    await customInine();
                    return true;
                }
                if (data.body.success == false) {
                    await logPush(body.errorMessage + '\n' + url);
                    return false;
                }
                let beginTime = data.body.data.beginTime;
                let endTime = data.body.data.endTime;
                let msg = `活动类型：pro邀请好友入会\n店铺名称：${data.body.data.shopName}\n\n奖励明细：\n`;
                let inviteNum = 0;
                let gift = [];
                data.body.data.rewards.forEach(t => {
                    msg += t.rewardName + '  共' + t.rewardTotal + '份  剩余' + t.rewardStock + '份  需邀请' + t.inviteNum + '人\n';
                    inviteNum += t.rewardStock;
                    gift.push(`${t.rewardName}:${t.rewardTotal}份`);
                });
                msg += '\n开始时间：' + dayjs(beginTime).format('YYYY-MM-DD HH:mm:ss');
                msg += '\n结束时间：' + dayjs(endTime).format('YYYY-MM-DD HH:mm:ss');
                msg += '\n活动链接：' + url;
                if (beginTime > nowTime) {
                    let cn = dayjs(beginTime - timer_before * 1000).format('s m H D M *');
                    msg += `\n活动未开始，设置定时:${dayjs(beginTime - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss')}`;
                    await setTimer(cn, cmd, beginTime - timer_before * 1000);
                    await pushAdmin(msg);
                    return false;
                }
                else if (endTime < nowTime) {
                    msg += '\n活动已结束!';
                    await logPush(msg);
                    await SpyIsValid.set(activityId, '活动已结束');
                    return false;
                }
                else if (inviteNum == 0) {
                    msg += '\n剩余奖励为0!';
                    await logPush(msg);
                    await SpyIsValid.set(activityId, '剩余奖励为0');
                    return false;
                }
                else {
                    await pushAdmin(msg + '\n线报有效，继续执行');
                }
                await customInine();
                return true;
            default:
                if (url.indexOf('/lzclient/') > -1 || url.match(/lzkj([\S]+)wxDrawActivity/)) {
                    // if (activityId.length > 32) {
                    //     await logPush('疑似垃圾线报(activityId超过32位),暂时不跑了。\n' + url);
                    //     await SpyIsValid.set(activityId, '疑似垃圾线报(activityId超过32位),暂时不跑了。');
                    //     return false;
                    // }
                    if (url.indexOf('wxDrawActivity') > -1) {
                        let body = await getUrl(url);
                        if (body.body.indexOf('<title>活动已结束</title>') > -1) {
                            await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                            await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                            return false;
                        }
                    }
                    // console.info(url);
                    let data = await request({
                        url: 'https://lzkj-isv.isvjd.com/wxCommonInfo/token',
                        method: 'get',
                        headers: {
                            'User-Agent': UA.USER_AGENT(),
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        json: true
                    });
                    //await pushAdmin(data.headers);
                    if (data.headers) {
                        data = await request({
                            url: 'https://lzkj-isv.isvjcloud.com/wxCommonInfo/initActInfo',
                            method: 'post',
                            body: 'activityId=' + activityId,
                            headers: {
                                'User-Agent': UA.USER_AGENT(),
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Cookie': data.headers['set-cookie']?.join(';'),
                            },
                            json: true
                        });
                        // await pushAdmin(data.body);
                        if (data.body?.result) {
                            let startTime = data.body.data.startTime;
                            let endTime = data.body.data.endTime;
                            if (startTime > nowTime) {
                                // startTimeStr = dayjs(startTime).format('YYYY-MM-DD HH:mm:ss');
                                await pushAdmin(`活动还没开始，设置定时：${dayjs(startTime - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss')}\n${url}`);
                                let cn = dayjs(startTime - timer_before * 1000).format('s m H D M *');
                                await setTimer(cn, cmd, startTime - timer_before * 1000);
                                return false;
                            }
                            else if (endTime < nowTime) {
                                await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                                await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                                return false;
                            }
                            else {
                                await customInine();
                                return true;
                            }
                        }
                        else {
                            //await logPush(data.body.errorMessage + "\n" + url);
                            await customInine();
                            return true;
                        }
                    }
                    await customInine();
                    return true;
                }
                let body = await getUrl(url);
                //console.log(body.body);
                if (body.body) {
                    // let titleReg = body.match(/(?<=\<title\>).*(?=\<\/title\>)/);
                    // let title = titleReg ? titleReg[0] : '';
                    if (body.body.indexOf('<title>活动已结束</title>') > -1) {
                        await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                        await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                        return false;
                    }
                    else if (body.body.indexOf('您来的太早了,活动尚未开始') > -1) {
                        await logPush('您来的太早了,活动尚未开始\n' + url);
                        return false;
                    }
                    // else if (!body.headers['set-cookie']) {
                    //     await pushAdmin('活动疑似已结束\n' + url);
                    //     return true;
                    // }
                }
                let bodyCk = body.headers['set-cookie']?.join(';');
                // console.log(bodyCk);
                if (url.indexOf('daily/wx') > -1) {
                    // if (url.indexOf('lzkj-isv') > -1) { // 无本暂时移除
                    //     await customInine();
                    //     return true;
                    // }
                    let actTimeStr = body.body.match(/(?<=actTimeStr\"[\s]value\=\").*至.*(?=\"\>)/)[0];
                    // await pushAdmin(actTimeStr);
                    let actTimeStrs = actTimeStr.split(' 至 ')
                    let startDate = new Date(actTimeStrs[0].substring(0, 16) + ':00');
                    let endDate = new Date(actTimeStrs[1].substring(0, 16) + ':00');
                    if (nowTime > endDate.getTime()) {
                        await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                        await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                        return false;
                    }
                    let msg = '活动类型：每日抢好礼\n活动时间：' + actTimeStr;
                    let giftJson = body.body.match(/(?<=giftJson\"[\s]value\=\')\{.*\}(?=\'\>)/)[0];
                    let gift = JSON.parse(giftJson);
                    msg += '\n开抢时间：' + gift.hours + ':' + gift.minutes;
                    let meno = `每日好礼：${gift.gift.giftName} 共${gift.total}份`;
                    msg += `\n${meno}`
                    msg += '\n活动链接：' + url;
                    if (['1', '9', '17'].includes(gift.gift.giftType)) {
                        await logPush(`${msg}\n${gift.gift.giftName}，垃圾不抢了~`);
                        await SpyIsValid.set(activityId, `${gift.gift.giftName}，垃圾不抢了~`);
                        return false;
                    }
                    if (!(await SpyIsValid.get('dayTimer', false))) {
                        await logPush(msg + '\n每日抢不定时，继续执行');
                        await customInine();
                        return true;
                    }
                    let dailyNum = await SpyIsValid.get('dailyNum', '10');
                    if (Number(gift.total) < Number(dailyNum)) {
                        await logPush(`${msg}\n低于${dailyNum}份数太少不抢了~`);
                        await SpyIsValid.set(activityId, `低于${dailyNum}份数太少不抢了~`);
                        return false;
                    }
                    let giftDate = new Date(`${dayjs(nowTime).format('YYYY-MM-DD')} ${gift.hours}:${gift.minutes}:00`);
                    if (Math.abs(nowTime - giftDate.getTime()) >= 10 * 1000) {
                        msg += '\n还没到开抢时间';
                        let nextDate = nowTime > giftDate.getTime() ? dayjs(giftDate).add(1, 'day')['$d'] : giftDate;
                        msg += '\n已设置定时：' + dayjs(nextDate.getTime() - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss');
                        await pushAdmin(msg);
                        let cn = dayjs(nextDate.getTime() - timer_before * 1000).format('s m H D M *');
                        await setTimer(cn, cmd, nextDate.getTime() - timer_before * 1000);
                        return false;
                    }
                    else {
                        await pushAdmin(msg + '\n到点了，开抢~');
                        await customInine();
                        return true;
                    }
                }
                else if (url.indexOf('signActivity') > -1) {
                    if (!venderId) {
                        venderId = body.body.match(/(?<=venderId\"\svalue\=\")\d+(?=\")/)[0];
                    }
                    let startTimeStr = body.body.match(/(?<=startTime\"[\s]value\=\")[\S]{10}\s[\S]{8}(?=\.0\"\>)/);
                    if (startTimeStr) {
                        startTimeStr = startTimeStr[0]
                    }
                    else {
                        return true;
                    }
                    console.log(startTimeStr);
                    let startDate = new Date(startTimeStr);
                    if (startDate.getTime() > nowTime && url.indexOf('lzkj-isv') > -1) {
                        await pushAdmin("活动还没开始，开始时间：" + startTimeStr + '\n' + url);
                        return false;
                    }
                    let data = await signInfo(url, bodyCk, activityId, venderId);
                    if (!data) {
                        return true;
                    }
                    // console.info(data);
                    let msg = '';
                    let wxSignActivityGiftBean = '';
                    let gifts = [];
                    if (url.indexOf('sevenDay') > -1) {
                        msg = '活动标题：7日签到';
                        wxSignActivityGiftBean = data;
                    }
                    else {
                        if (data.act.endTime < nowTime) {
                            await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                            await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                            return false;
                        }
                        msg = `活动标题：${data.act.actName}\n活动时间：${data.act.actTimeStr}`;
                        wxSignActivityGiftBean = data.act.wxSignActivityGiftBean;

                        if (wxSignActivityGiftBean.hasGiftEveryDay == 'y') {
                            let total = wxSignActivityGiftBean.gift.giftTotal ? wxSignActivityGiftBean.gift.giftTotal : '未知';
                            msg += `\n每日签到奖品：\n${wxSignActivityGiftBean.gift.giftName} 数量：${total}份 是否发完：${wxSignActivityGiftBean.gift.insufficient}`
                            gifts.push('每日:' + wxSignActivityGiftBean.gift.giftName);
                        }
                    }
                    msg += '\n连续签到奖品：'
                    let maxSign = 0;
                    let shiwu = false;
                    wxSignActivityGiftBean.giftConditions.forEach(t => {
                        if (t.gift) {
                            let giftTotal = t.gift.giftTotal ? '数量：' + t.gift.giftTotal : '';
                            msg += `\n${t.gift.giftName} 签到天数：${t.dayNum} ${giftTotal} 是否发完：${t.gift.insufficient}`
                            maxSign = t.dayNum;
                            if (!shiwu) {
                                shiwu = t.gift.giftType == 7 ? true : false
                            }
                            gifts.push(`${t.dayNum}天:${t.gift.giftName}`);
                        }
                    });
                    msg += '\n活动链接：' + url;
                    if (!(await SpyIsValid.get('signTimer', false))) {
                        msg += '\n签到定时功能没启用，继续执行'
                        await logPush(msg);
                        await customInine();
                        return true;
                    }
                    if (msg.indexOf('京豆') == -1 && msg.indexOf('E卡') == -1) {
                        await logPush(`垃圾不签了。\n${msg}`);
                        await SpyIsValid.set(activityId, '垃圾不签了。');
                        return false;
                    }
                    if (startTimeStr.substring(0, 10) != dayjs().format('YYYY-MM-DD') && dayjs(startTimeStr)['$d'].getTime() < nowTime) {
                        let sign_disable_fisrt = await SpyIsValid.get('nofisrtSign', true);
                        await logPush(`非首日不定时了${sign_disable_fisrt ? '' : '，不执行'}。\n${msg}`);
                        // await SpyIsValid.set(activityId, `非首日不定时不执行了`);
                        await customInine();
                        return sign_disable_fisrt;
                    }
                    let signTimeDays = await SpyIsValid.get('signTimeDays', '999');
                    if (Number(signTimeDays) < Number(maxSign)) {
                        msg += `\n所需签到天数大于${signTimeDays}，不定时了，不执行`
                        await logPush(msg);
                        await customInine();
                        await SpyIsValid.set(activityId, `\n所需签到天数大于${signTimeDays}，不定时了`);
                        return false;
                    }
                    let signEnd = dayjs(startDate).add(Number(maxSign) - 1, 'day')['$d'];
                    if (startDate.getTime() > nowTime) {
                        msg += `\n设置定时：${startTimeStr}至${dayjs(signEnd).format('YYYY-MM-DD HH:mm:ss')}`
                        await setDayTimer(startDate, signEnd, envObj.key, envObj.val, maxSign);
                        msg += "\n活动还没开始，开始时间：" + startTimeStr;
                        await pushAdmin(msg);
                        return false;
                    }
                    else {
                        startDate = dayjs(startDate).add(1, 'day')['$d'];
                        msg += `\n设置定时：${dayjs(startDate).format('YYYY-MM-DD')} 00:00:00至${dayjs(signEnd).format('YYYY-MM-DD HH:mm:ss')}`
                        await setDayTimer(startDate, signEnd, envObj.key, envObj.val, maxSign);
                        await pushAdmin(msg);
                        await customInine();
                        return true;
                    }
                }
                else if (url.indexOf('/wxGameActivity/') > -1 || url.indexOf('/wxSecond/') > -1 || url.indexOf('/wxCartKoi/') > -1
                    || url.indexOf('wxCollectionActivity/activity2') > -1 || url.match(/lzkj([\S]+)(wxShopFollowActivity|wxShareActivity|wxDrawActivity)/)) {
                    // && url.indexOf('/wxTeam/') == -1
                    // url.indexOf('/activity2') > -1
                    // startTime = body.match(/(?<=startTime\'[\s]value=\')[\S]{19}(?=\.0\'\>)/)[0]
                    let startTimes = body.body.match(/(?<=startTime\"[\s]value\=\")[\S]{10}\s[\S]{8}(?=\.0\"\>)/);
                    if (!startTimes[0]) {
                        return true;
                    }
                    let startTimeStr = startTimes[0];
                    let startTime = new Date(startTimeStr);
                    // await pushAdmin(startTimeStr);
                    if (startTime.getTime() > nowTime) {
                        await pushAdmin(`活动还没开始，设置定时：${dayjs(startTime.getTime() - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss')}\n${url}`);
                        let cn = dayjs(startTime.getTime() - timer_before * 1000).format('s m H D M *');
                        await setTimer(cn, cmd, startTime.getTime() - timer_before * 1000);
                        return false;
                    }
                    else {
                        await customInine();
                        return true;
                    }
                }
                else {
                    let data = await actInfo(url, bodyCk, activityId);
                    if (!data) {
                        await customInine();
                        return true;
                    }
                    if (data && data.result) {
                        //组队
                        if (url.indexOf('/wxTeam/') > -1) {
                            let msg = `活动标题：${data.data.active.actName}\n` +
                                `奖品类型：${data.data.active.prizeType == 9 ? '积分' : '京豆'}` +
                                `\n奖池总计：${data.data.active.sendNumbers}` +
                                `\n队伍奖励：${data.data.active.prizeNumbers}` +
                                `\n额外奖励：${data.data.active.extraPrizeNumbers}` +
                                `\n最高组队：${data.data.active.maxGroup}` +
                                `\n开始时间：${data.data.active.startTimeStr}` +
                                `\n结束时间：${data.data.active.endTimeStr}` +
                                `\n活动链接：${data.data.active.actUrl}`
                                ;
                            if (data.data.active.endTime < nowTime) {
                                msg += '\n\n活动已结束!';
                                await logPush(msg);
                                await SpyIsValid.set(activityId, '活动已结束!');
                                return false;
                            }
                            else if (data.data.active.startTime > nowTime) {
                                if (data.data.active.prizeType == 9) {
                                    msg += `\n活动未开始，积分不定时`
                                    await logPush(msg);
                                }
                                else {
                                    msg += `\n活动未开始，设置定时：${dayjs(data.data.active.startTime - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss')}`;
                                    await pushAdmin(msg);
                                    let cn = dayjs(data.data.active.startTime - timer_before * 1000).format('s m H D M *');
                                    await setTimer(cn, cmd, data.data.active.startTime - timer_before * 1000);
                                }
                                return false;
                            }
                            else {
                                await pushAdmin(msg + '\n线报有效，继续执行');
                                await customInine();
                                return true;
                            }
                        }
                        else {
                            if (url.indexOf('wxFansInterActionActivity') > -1) {
                                data = data.data.actInfo;
                            }
                            else {
                                data = data.data;
                            }
                            let startTime = data.startTime;
                            let endTime = data.endTime;
                            let msg = '';
                            // let meno = title;
                            if (url.indexOf('wxCollectionActivity') > -1) {
                                msg += `活动标题：加购有礼\n加购数量：${data.needCollectionSize}件\n奖品名称：${data.drawInfo.name}\n活动时间：${dayjs(startTime).format('YYYY-MM-DD HH:mm:ss')}至${dayjs(endTime).format('YYYY-MM-DD HH:mm:ss')}`
                                // meno = `${data.drawInfo.name}:加购${data.needCollectionSize}件`
                                if (data.drawInfo.name.indexOf('优惠券') > -1) {
                                    msg += `\n活动连接：${url}\n垃圾不加购了~`;
                                    await logPush(msg);
                                    await SpyIsValid.set(activityId, '垃圾不加购了~');
                                    return false;
                                }
                                else if (data.drawInfo.name.indexOf('积分') > -1 && data.drawInfo.value < 100) {
                                    msg += `\n活动连接：${url}\n积分太少不加购了~`
                                    await logPush(msg);
                                    await SpyIsValid.set(activityId, '积分太少不加购了~');
                                    return false;
                                }
                            }
                            // else if (url.indexOf('wxShareActivity') > -1) {
                            //     msg += `活动标题：分享有礼\n分享数量：${data.needCollectionSize}人\n奖品名称：${data.drawInfo.name}\n活动时间：${dayjs(startTime).format('YYYY-MM-DD HH:mm:ss')}至${dayjs(endTime).format('YYYY-MM-DD HH:mm:ss')}\n活动连接：${url}`
                            //     if(data.drawInfo.name.indexOf('优惠券') > -1){
                            //         msg +='\n垃圾不分享了~'
                            //         await pushAdmin(msg);
                            //         return;
                            //     }
                            // }
                            if (startTime > nowTime) {
                                await pushAdmin(`${msg}\n活动还没开始，设置定时：${dayjs(startTime - timer_before * 1000).format('YYYY-MM-DD HH:mm:ss')}\n${url}`);
                                let cn = dayjs(startTime - timer_before * 1000).format('s m H D M *');
                                await setTimer(cn, cmd, startTime - timer_before * 1000);
                                return false;
                            }
                            else if (endTime < nowTime) {
                                await logPush('很抱歉，您来晚了，活动已经结束~\n' + url);
                                await SpyIsValid.set(activityId, '很抱歉，您来晚了，活动已经结束~');
                                return false;
                            }
                            else {
                                if (msg) {
                                    await pushAdmin(`${msg}\n${url}`);
                                }
                                await customInine();
                                return true;
                            }
                        }
                    }
                    else {
                        if (url.indexOf('/wxShopGift/') > -1 && data.errorMessage) {
                            await logPush(data.errorMessage + '\n' + url);
                            await SpyIsValid.set(activityId, data.errorMessage);
                            return false;
                        }
                        else if (data.errorMessage) {
                            console.log(data.errorMessage + ' ' + url);
                        }
                        await customInine();
                        return true;
                    }
                }
        }
    }
    catch (error) {
        console.info(error);
        await customInine();
        return true;
    }

    async function customInine() {
        let custom_export = await SpyCronDB.get('custom_export');
        if (custom_export) {
            await sysMethod.inline(`${custom_export} ${cmd}`);
        }
    }


    async function getUrl(url) {
        let data = await request({
            url: url,
            headers: {
                'User-Agent': UA.USER_AGENT(),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'get',
            timeOut: 60000
        });
        return data;
    }

    async function pushAdmin(msg) {
        msg = `#${envObj.key}\n活动Id：${activityId}\n${msg}`
        let isPush = await SpyIsValid.get('isPush');
        if (isPush) {
            let item = isPush.split(':');
            if (item.length == 3) {
                await sysMethod.push({
                    platform: item[0],
                    groupId: item[1] == 'groupId' ? item[2] : '',
                    userId: item[1] == 'userId' ? item[2] : '',
                    msg: msg,
                    type: 'text',
                });
            }
            else {
                console.log("推送配置有误~");
                await sysMethod.pushAdmin({
                    platform: ['tgBot'],
                    //type: text,
                    msg: msg
                });
            }
        }
        else {
            await sysMethod.pushAdmin({
                platform: ['tgBot'],
                //type: text,
                msg: msg
            });
        }
    }

    async function GetPinCookie() {
        let qlDb = await QlMod.GetQlDataBase(),
            qlDbArr = qlDb['data'] ? qlDb['data'] : (qlDb['data'] = []),
            defaultNum = typeof qlDb['Default'] === 'number' ? qlDb['Default'] : 0,
            nowAllEnv = await QlMod.GetQlAllEnvs(qlDbArr, defaultNum);
        if (!nowAllEnv.status) return true;
        nowAllEnv = nowAllEnv.data;
        let cookie = nowAllEnv[1]['value'];
        //打乱
        // nowAllEnv.sort(function () {
        //     return (0.5 - Math.random());
        // })
        // for (const e of nowAllEnv) {
        //     if (e['name'] === 'JD_COOKIE' && e['status'] == 0) {
        //         cookie = e['value'];
        //         break;
        //     }
        // }
        return cookie
    }

    async function logPush(msg) {
        msg = `#${envObj.key}\n活动Id：${activityId}\n${msg}`
        let invalid_tips = await SpyIsValid.get('invalid_tips', false);
        if (invalid_tips) {
            const item = invalid_tips.split(':');
            await sysMethod.push({
                platform: item[0],
                groupId: item[1] == 'groupId' ? item[2] : '',
                userId: item[1] == 'userId' ? item[2] : '',
                msg: msg,
                type: 'text',
            });
        }
        else {
            console.log(msg);
        }
    }

    function getQueryString(url, name) {
        let reg = new RegExp('([?&])' + name + '=([^&]+)');
        let r = url.match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return '';
    }

    async function setTimer(cron, cmd, time) {
        await sysMethod.inline(`spy定时插队 ${cron} ${cmd}`);
        await SpyIsValid.set(activityId, time);
    }

    async function setDayTimer(startTime, endTime, name, value, maxSign) {
        let i = 2;
        while (i <= maxSign) {
            let cn = dayjs(startTime).format('0 0 0 D M *');
            if (i == maxSign && timer_before) {
                try {
                    let tempDate = dayjs(startTime).startOf('day').subtract(timer_before, 'second');
                    startTime = tempDate['$d']
                    cn = tempDate.format('s m H D M *');
                    // console.log(cn);
                    await pushAdmin(`最后一天的签到定时提前${timer_before}秒:\nspy定时插队 ${cn} export ${name}="${value}&day=${i}"`)
                }
                catch (error) {
                    console.log(error);
                }
            }
            await setTimer(cn, `export ${name}="${value}&day=${i}"`, startTime.getTime());
            await sysMethod.sleep(0.5);
            startTime = dayjs(startTime).add(1, 'day')['$d'];
            i++
            // await pushAdmin(startDate);
        }
    }

    // async function isExistTimer(id) {
    //     if (!timer_activityIds) {
    //         console.log(`正在读取已定时的活动ID，用于去重，只有首次会噢`);
    //         // await SpyIsValid.set('timer_activityIds', true);
    //         timer_activityIds = {};
    //         let keys = await SpyCronDB.keys();
    //         for (let key of keys || []) {
    //             let value = await SpyCronDB.get(key);
    //             if (value) {
    //                 if (value.strMsg.indexOf('export') > -1) {
    //                     let strMsgs = value.strMsg.match(/"(.*?)"/);
    //                     let actid = strMsgs[1];
    //                     // console.log(actid);
    //                     if (actid.indexOf('https://') > -1) {
    //                         actid = getQueryString(actid, 'activityId') || getQueryString(actid, 'id');
    //                     }
    //                     timer_activityIds[actid] = value.schedule;
    //                 }
    //             }
    //         }
    //         await SpyIsValid.set('timer_activityIds', timer_activityIds);
    //     }
    //     if (timer_activityIds[id]) {
    //         return timer_activityIds[id];
    //     }
    //     else {
    //         return false;
    //     }
    // }

    function random_pin() {
        let y = '';
        for (let i = 0; i < 10; i++) {
            let thisIndex = Math.floor((Math.random() * t.length));
            y += t[thisIndex];
        }
        return `jd_${y}`;
    }

    async function signInfo(url, cookie, activityId, venderId) {
        let urls = url.split('/signActivity');
        let pin = random_pin();
        let api = urls[0] + '/wx/getActivity';
        // await pushAdmin(api)
        if (url.indexOf('sevenDay') > -1) {
            api = urls[0] + '/wx/getSignInfo'
        }
        let data = await request({
            url: api,
            method: 'post',
            body: 'actId=' + activityId + '&venderId=' + venderId + '&pin=' + pin,
            headers: {
                'User-Agent': UA.USER_AGENT(),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
                'Referer': url
            },
            json: true
        });
        return data.body;
    }

    async function actInfo(url, cookie, activityId) {
        let urls = url.split('/activity');
        let pin = random_pin();
        let api = urls[0] + '/activityContent';
        let body = 'activityId=' + activityId
        if (url.indexOf('wxShopFollowActivity') > -1) {
            api += 'Only';
        }
        //else if (url.indexOf('wxFansInterActionActivity') > -1) {
        //pin = 'SpnVwYvsziRXXemseUM/CU7oeVP9kq2pYSH90mYt4m3fwcJlClpxrfmVYaGKuquQkdK3rLBQpEQH9V4tdrrh0w==';
        //}
        else if (url.indexOf('completeInfoActivity') > 1) {
            api = url.match(/https?:\/\/([^/]+)/)[0] + '/completeInfoActivity/selectById';
            let venderId = getQueryString(url, 'venderId');
            // await pushAdmin(api);
            body = 'activityId=' + activityId + '&venderId=' + venderId;
        }
        body += '&pin=' + pin + '&buyerPin=' + pin + '&signUuid=';
        // if (url.indexOf('/wxDrawActivity/') > -1) {
        //     api = api.replace('wxDrawActivity','wxPointDrawActivity')
        // }
        // await pushAdmin(api)
        let data = await request({
            url: api,
            method: 'post',
            body: body,
            headers: {
                'User-Agent': UA.USER_AGENT(),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
                'Referer': url
            },
            json: true,
            timeOut: 30000
        });
        return data.body;
    }
    /* 
    如果该导出的函数返回值为false,该变量不会被加入队列 
    注意 
    变量到该模块后 限定时间为60秒,60秒后强制返回true
    如果该模块中的代码报错,将强制返回的true */
};
/* HideEnd */