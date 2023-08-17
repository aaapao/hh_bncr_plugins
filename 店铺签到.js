/**
 * @author 小寒寒
 * @name 店铺签到
 * @origin 小寒寒
 * @version 1.0.1
 * @description 店铺签到
 * @rule ^(店铺签到|签到检查|签到爬取|签到清理)$
 * @rule ^(签到转码)([\s\S]+)$
 * @rule [0-9]{1,3}天[0-9]{1,3}.0豆
 * @rule [0-9]{1,3}天[0-9]{1,3}豆
 * @rule [0-9]{1,3}天,[0-9]{1,3}京豆
 * @admin false
 * @public false
 * @priority 99999999
 */

/*
初版，自行定时（暂无定时运行通知），仅超授可用，命令覆盖红灯区店铺签到监控

介绍：
1.店铺签到：根据下列变量配置相关签到容器和ck数，签到后自动检查
2.签到检查：自动删除已满签、结束的token，检查ck1的签到天数
3.签到转码：格式 签到转码 https://u.id.com/xxxxxxx https://u.id.com/xxxxxxx https://u.id.com/xxxxxxx
    自动入库，非首日不入库，超过20个后不入库
    可手工删除 del shopToken token
    有新的会自动签到，签到后自动检查
4.签到爬取：默认只爬取当天的，爬取后自动转码，有新的自动签到，签到后自动检查
5.https://t.me/mihuc_bot 店铺签到线报监控，自动转码，有新的会自动签到，签到后自动检查
6.支持token并发签到，不支持ck并发签到
7.还有些小bug懒得修了，不如某些大佬的好用，但是凑合能用，用代理可以解决403的问题

官方插件创建定时任务：
sysMethod.cron.newCron('0 0 22 * * *', () => {
    sysMethod.inline('签到检查');
});

sysMethod.cron.newCron('0 0 23 * * *', () => {
    sysMethod.inline('签到爬取');
});

sysMethod.cron.newCron('58 59 23 * * *', () => {
    sysMethod.inline('店铺签到');
});
*/

const qlNum = 0; // 取哪个容器的ck
const ckNum = 5; // 签到前ck数
const signTxtUrl = 'http://jd.lsy22.cn/BFx'; // 签到爬取的文档
const prizeNum = 50; // 奖品数量，低于则不入库
const maxRetryCount = 5; // 签到重试次数
const proxyApi = 'http://api2.xkdaili.com/tools/XApi.ashx?apikey=XK7C84C898B90833D481&qty=1&format=txt&split=0&sign=77141db92a0638cb19733be9f8708cdf'; // 代理api，留空则不使用，多号推荐使用

const H5ST = require('./mod/h5st.js');
const { USER_AGENT } = require('../红灯区/mod/USER_AGENTS.js');
const QlMod = require('../红灯区/mod/AmQlMod.js');
module.exports = async s => {
    /* HideStart */
    const limit = 20;
    const valid = await sysMethod.isDev();
    if (!valid) return s.delMsg(await s.reply('非超授禁用插件'), { wait: 30 });
    await sysMethod.testModule(['date-fns', 'input'], { install: true });
    const request = require('util').promisify(require('request'));
    const dayjs = require('dayjs');
    const shopToken = new BncrDB('shopToken');

    // const tokens = ['E0CAF3432AECF0AF6192FB85182F9703', 'CBAB440D3DBD822FFE90B8842147570D',
    //     '9935CC2D633C171A5A47E5D3D7B3354D', '0F7E326AC7AB0A40E16BB8D5B9F74F8E',
    //     '766DFFF41BA4B3CA3EF5C3B07D91C5D8', '82CAD86E37E170D59B4CFB5E31C5DFE9',
    //     '567D4AA74E340AA395499CFED1FCC9E2', '88887FFC5B19B4469F99D450291EC644',
    //     'EA1D4749C2CFCE4F96CE8F8259A3B3F4'];
    let tokens = await shopToken.keys();

    let qlDb = await QlMod.GetQlDataBase();
    let qlDbArr = qlDb['data'] || [];
    if (qlDbArr.length == 0) return s.reply('请先发“面板管理”添加面板');

    let cookies = await QlMod.SearchQlEnvs(qlDbArr, qlNum, 'JD_COOKIE');
    let cookiesArr = cookies.data;
    const now = new Date().getTime();

    let param1 = s.param(1);
    if (param1 == '签到检查') {
        if (!(await s.isAdmin())) return;
        let cookie = cookiesArr[0].value;
        console.log(cookie);
        if (tokens && tokens.length > 0) {
            let k = 1;
            for (let token of tokens || []) {
                // if (k > limit) {
                //     await s.reply(`${token}数量超过了限制，已清除。`);
                //     await shopToken.del(token);
                //     continue;
                // }
                let tokenInfo = await shopToken.get(token);
                if (tokenInfo.endTime < now) {
                    await s.reply(`${token}过期了，已清除。`);
                    await shopToken.del(token);
                    k--;
                    continue;
                }
                let info = `${token}\n开始时间：${dayjs(tokenInfo.startTime).format('YYYY-MM-DD')}\n结束时间：${dayjs(tokenInfo.endTime).format('YYYY-MM-DD')}`;
                let maxDay = 999;
                if (tokenInfo.continuePrizeRuleList) {
                    info += '\n签到奖励：'
                    for (let i of tokenInfo.continuePrizeRuleList) {
                        for (let j of i.prizeList) {
                            if (j.type == 4) {
                                info += `\n${i.level}天,${j.discount}京豆,共${j.number}份`
                            }
                            else if (j.type == 10) {
                                info += `\n${i.level}天,${j.discount}E卡,共${j.number}份`
                            }
                            else if (j.type == 14) {
                                info += `\n${i.level}天,${j.discount / 100}红包,共${j.number}份`
                            }
                            maxDay = i.level;
                        }
                    }
                }
                let days = await getSignRecord(token, tokenInfo.venderId, tokenInfo.id, cookie);
                info += `\n签到天数：${days}`;
                if (days >= maxDay) {
                    await s.reply(`${info}\n签满了，已清除。`);
                    await shopToken.del(token);
                    k--;
                    continue;
                }
                var needDays = Math.floor((now - tokenInfo.startTime) / (24 * 3600 * 1000));
                if (needDays >= maxDay) {
                    await s.reply(`${info}\n已经达到最大天数，${maxDay}天，已清除。`);
                    await shopToken.del(token);
                    k--;
                    continue;
                }
                if (days != '未知' && needDays - days >= 1) {
                    await s.reply(`${info}\n漏签了${needDays - days}天，已清除。`);
                    await shopToken.del(token);
                    k--;
                    continue;
                }
                await s.reply(`${info}`);
                k++;
                await sysMethod.sleep(2);
                // break;
            }
            s.delMsg(await s.reply(`签到检查完毕，还剩余${k}个token。`), { wait: 10 });
        }
        else {
            s.delMsg(await s.reply(`无左侧店铺签到token`), { wait: 10 });
        }
    }
    else if (param1 == '店铺签到') {
        if (!(await s.isAdmin())) return;
        let msg = '';
        for (let i = 0; i < ckNum; i++) {
            if (cookiesArr[i]) {
                if(cookiesArr[i].status == 1){
                    await s.reply(`第${i + 1}个ck进行签到：\nck已失效或禁用！`);
                    continue;
                }
                let cookie = cookiesArr[i].value;
                let urlList = [];
                let pin = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
                for (let token of tokens || []) {
                    let tokenInfo = await shopToken.get(token);
                    let url = `https://api.m.jd.com/api?${await getH5st('interCenter_shopSign', pin, 'interact_center_shopSign_signCollectGift', `{"token":"${token}","venderId":"${tokenInfo.venderId}","activityId":"${tokenInfo.id}","type":56,"actionType":7}`)}`;
                    urlList.push(url);
                }
                for (let j = 0; j < 10; j++) {
                    let proxy = '';
                    if (proxyApi) {
                        proxy = await getProxyIp();
                    }
                    await s.reply(`第${i + 1}个ck正在${proxy ? '用代理' + proxy : ''}签到`);
                    const responses = await Promise.all(urlList.map(url => signCollectGift(url, cookie, proxy)));
                    msg = responses.map(res => {
                        if (res == '403') {
                            return res;
                        }
                        else {
                            let result = JSON.parse(res);
                            return result.success ? '签到成功' : result.msg;
                        }
                    }).join('\n');
                    if (msg.indexOf('403') == -1) {
                        break;
                    }
                }
                await s.reply(`第${i + 1}个ck进行签到：\n` + msg);
                tokens = await shopToken.keys();
            }
        }
        await sysMethod.sleep(3);
        await s.reply(`签到完成，开始执行签到检查...`);
        await s.inlineSugar('签到检查');
    }
    else if (param1 == '签到转码') {
        if (!(await s.isAdmin())) return;
        let param2 = s.param(2);
        let urls = param2.match(/https:\/\/u\.jd\.com\/[a-zA-Z0-9]{7}/g);
        if (urls && urls.length > 0) {
            urls = [...new Set(urls)];
            let msg = [];
            for (let url of urls) {
                if (tokens.length >= limit - 1) {
                    await s.reply(`签到店铺数量已达到${limit}个，请清理后再进行签到转码。`);
                    break;
                }
                let tokenMsg = await getToken(url);
                msg.push(tokenMsg);
            }
            await s.reply(msg.join('\n---------------\n'));
            if (msg.join(',').indexOf('已入库') > -1) {
                s.delMsg(await s.reply('发现有新的token入库，开始执行店铺签到...'), { wait: 10 });
                await s.inlineSugar('店铺签到');
            }
        }
        else {
            s.delMsg(await s.reply(`不存在有效的店铺签到url`), { wait: 10 });
        }
    }
    else if (param1 == '签到爬取') {
        if (!(await s.isAdmin())) return;
        let html = await request({
            url: signTxtUrl,
            method: 'get'
        });
        let today = dayjs().format('M月DD日');
        // today = '6月17日';
        let reg = new RegExp(`(?<=${today}新增 跳app左).*?(?=日新增 跳app左)`);

        let contents = html.body.match(reg);
        if (contents && contents.length > 0) {
            let content = contents[0];
            let urls = content.match(/https:\/\/u\.jd\.com\/[a-zA-Z0-9]{7}/g);
            urls = [...new Set(urls)];
            // if (ImType() == 'fake') {
            //     notifyMasters(`【店铺签到爬取】信息包含：短链${urls.length}个\n开始提取token，请稍候...`);
            // }
            s.delMsg(await s.reply(`发现短链${urls.length}个\n开始提取token，正在签到转码...`), { wait: 10 });
            await s.inlineSugar('签到转码' + urls.join('\n'));
        }
        else {
            s.delMsg(await s.reply('今日暂无数据'), { wait: 10 });
        }
    }
    else {
        const content = s.getMsg();
        let contTokens = content.match(/[A-Z0-9]{32}/g) || [];
        let contUrls = content.match(/https:\/\/u\.jd\.com\/[a-zA-Z0-9]{7}/g);
        if (contUrls && contUrls.length > 0) {
            for (let contUrl of contUrls || []) {
                let url = await request({
                    url: contUrl,
                    method: 'get'
                });
                let hrl = url.body.match(/(?<=var hrl\=\').*?(?=\';)/);
                // console.log(hrl);
                if (hrl[0]) {
                    let orgUrl = await request({
                        url: hrl[0],
                        method: 'get',
                        followRedirect: false
                    });
                    console.log(orgUrl.headers.location);
                    let token = getQueryString(orgUrl.headers.location, 'token');
                    if (token) {
                        contTokens.push(token);
                    }
                }
            }
        }
        if (contTokens && contTokens.length > 0) {
            await s.reply(`发现${contTokens.length}个token，正在提取...`);
            let tokenMsg = []
            for (let cont of contTokens || []) {
                if (tokens.length >= limit - 1) {
                    await s.reply(`签到店铺数量已达到${limit}个，请清理后再进行签到转码。`);
                    break;
                }
                tokenMsg.push(await getActivityInfo(cont));
            }
            await s.reply(tokenMsg.join('\n---------------\n'));
            if (tokenMsg.join(',').indexOf('已入库') > -1) {
                s.delMsg(await s.reply('发现有新的token入库，执行店铺签到...'), { wait: 10 });
                if (await s.isAdmin()) {
                    await s.inlineSugar('店铺签到');
                }
                else {
                    sysMethod.inline('店铺签到');
                }
            }
        }
        else {
            s.delMsg(await s.reply(`不存在有效的店铺签到TOKEN`), { wait: 10 });
        }
    }

    async function getToken(url) {
        let orgUrl = await request({
            url: url,
            method: 'get'
        });

        let hrl = orgUrl.body.match(/(?<=var hrl\=\').*?(?=\';)/);

        //console.log(hrl[0]);
        if (hrl[0]) {
            orgUrl = await request({
                url: hrl[0],
                method: 'get',
                followRedirect: false
            });
            console.log(orgUrl.headers.location);
            if (orgUrl.headers?.location) {
                let param = orgUrl.headers.location.split('?')[1];
                let bodys = param.split('&');
                let body = {};
                for (let a of bodys) {
                    let b = a.split('=');
                    body[b[0]] = b[1];
                }
                let homeActivity = await request({
                    url: `https://api.m.jd.com/client.action?functionId=whx_getShopHomeActivityInfo&appid=shop_m_jd_com&clientVersion=11.0.0&client=wh5&body=${JSON.stringify(body)}`,
                    method: 'get',
                    json: true,
                    headers: {
                        'Referer': 'https://api.m.jd.com',
                        'User-Agent': USER_AGENT(),
                    }
                });
                console.log(homeActivity.body);
                if (homeActivity.body?.result?.signStatus?.isvUrl) {
                    let token = getQueryString(homeActivity.body.result.signStatus.isvUrl, 'token');
                    if (token) {
                        return await getActivityInfo(token);
                    }
                    else {
                        return `${url}获取token失败。`;
                    }
                }
                else {
                    return `${url}未发现签到信息。`;
                }
            }
        }
        return `${url}获取token失败。`;
    }

    function getQueryString(url, name) {
        let reg = new RegExp('(^|&|)' + name + '=([^&]*)(&|$)', 'i');
        let r = url.match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return '';
    }

    async function getProxyIp() {
        let data = await request({
            url: proxyApi,
            method: 'get'
        });
        let body = data.body.split('\n')[0];
        return body;
    }

    function signCollectGift(url, cookie, proxy) {
        return new Promise((resolve, reject) => {
            let retryTimes = 0;

            function doRequest() {
                retryTimes++;
                if (retryTimes > maxRetryCount) {
                    // reject(new Error(`Failed to get response from url after ${maxRetryCount} retries`));
                    resolve('403')
                    return;
                }
                let options = {
                    url: url,
                    headers: {
                        'Referer': 'https://api.m.jd.com',
                        'User-Agent': USER_AGENT(),
                        'Cookie': cookie
                    },
                    method: 'get',
                    timeout: 15 * 1000
                };
                if (proxy) {
                    options = {
                        url: url,
                        proxy: `http://${proxy}`,
                        headers: {
                            'Referer': 'https://api.m.jd.com',
                            'User-Agent': USER_AGENT(),
                            'Cookie': cookie
                        },
                        method: 'get',
                        timeout: 15 * 1000
                    };
                }
                request(options, (err, res, body) => {
                    if (err) {
                        console.error(err);
                        console.log(`Retrying url for the ${retryTimes} time`);
                        doRequest();
                    }
                    else if (res.statusCode == 403) {
                        console.log(`Retrying url for the ${retryTimes} time because of HTTP 403`);
                        doRequest(); // 403重试
                    }
                    else {
                        resolve(body);
                    }
                }).catch(err => {
                    doRequest();
                });
            }

            doRequest(); // 开始发送请求
        });
    }

    async function getSignRecord(token, venderId, activityId, cookie) {
        let pin = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        let signRecord = await request({
            url: 'https://api.m.jd.com/api?' + await getH5st('interCenter_shopSign', pin, 'interact_center_shopSign_getSignRecord', `{"token":"${token}","venderId":"${venderId}","activityId":"${activityId}","type":56,"actionType":7}`),
            method: 'get',
            headers: {
                'Referer': 'https://api.m.jd.com',
                'User-Agent': USER_AGENT(),
                'Cookie': cookie
            },
            json: true
        });
        // await s.reply(JSON.stringify(signRecord.body));
        return signRecord.body?.data?.days || '未知';
    }

    async function getActivityInfo(token) {
        let activityInfo;
        for (let i = 0; i < 20; i++) {
            activityInfo = await request({
                url: 'https://api.m.jd.com/api?' + await getH5st('interCenter_shopSign', '', 'interact_center_shopSign_getActivityInfo', `{"token":"${token}","venderId":""}`),
                method: 'get',
                headers: {
                    'Referer': 'https://api.m.jd.com',
                    'User-Agent': USER_AGENT(),
                    // 'Cookie': cookie
                },
                json: true
            });
            if (activityInfo.body) {
                break;
            }
            // await sysMethod.sleep(3);
        }
        if (activityInfo.body?.data) {
            let data = activityInfo.body.data;
            if (tokens.includes(token)) {
                return `${token}：已存在`;
            }
            else if (dayjs(data.startTime).format('YYYY-MM-DD') != dayjs().format('YYYY-MM-DD') && !(await s.isAdmin())) {
                return `${token}：非首日不入库`;
            }
            else {
                let info = `${token}：\n开始时间：${dayjs(data.startTime).format('YYYY-MM-DD')}\n结束时间：${dayjs(data.endTime).format('YYYY-MM-DD')}`;
                let number = 0;
                if (data.continuePrizeRuleList) {
                    info += '\n签到奖励：'
                    for (let i of data.continuePrizeRuleList) {
                        for (let j of i.prizeList) {
                            if (j.type == 4) {
                                info += `\n${i.level}天,${j.discount}京豆,共${j.number}份`
                            }
                            else if (j.type == 10) {
                                info += `\n${i.level}天,${j.discount}E卡,共${j.number}份`
                            }
                            else if (j.type == 14) {
                                info += `\n${i.level}天,${j.discount / 100}红包,共${j.number}份`
                            }
                            if (number < j.number) {
                                number = j.number;
                            }
                        }
                    }
                }
                if (number < prizeNum) {
                    info += `\n最高份数低于${prizeNum}，不入库。`
                }
                else {
                    info += `\n已入库`;
                    await shopToken.set(token, data);
                    tokens.push(token);
                }
                return info;
            }
        }
        else {
            return `${token}：获取签到信息失败。`;
        }
    }

    async function getH5st(appid, pin, functionId, body) {
        let new_H5ST = new H5ST({
            'appId': '4da33',
            'appid': appid,
            'clientVersion': '4.9.0',//6.0.0
            'client': 'android',
            'pin': pin,
            'ua': USER_AGENT(),
            'version': '4.1'
        });
        await new_H5ST.genAlgo();
        let data = await new_H5ST.genUrlParams(functionId, body);//拼接的url参数
        return data;
    }
    /* HideEnd */
}