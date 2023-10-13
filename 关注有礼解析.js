/**
 * @author 小寒寒
 * @name 关注有礼解析
 * @origin 小寒寒
 * @version 1.0.1
 * @description 关注有礼解析
 * @rule 关注[\s\S]*https:\/\/u\.jd\.com\/[0-9a-zA-Z]{7}
 * @priority 10000
 * @admin false
 * @disable false
 * */

const envName = 'M_FOLLOW_SHOP_ARGV';

const request = require('util').promisify(require('request'));
const { USER_AGENT } = require('../红灯区/mod/USER_AGENTS.js');
module.exports = async s => {
    try {
        const content = await s.getMsg();
        const ujds = content.match(/https:\/\/u\.jd\.com\/[0-9a-zA-Z]{7}/g);
        if (ujds[0]) {
            for (let ujd of ujds || []) {
                // console.log(ujd)
                let res = await request({
                    url: ujd,
                    method: 'get',
                    followRedirect: false
                });
                let data = res.body;
                let url = data.match(/(https:\/\/u\.jd\.com\/jda[^']+)/) && data.match(/(https:\/\/u\.jd\.com\/jda[^']+)/)[1] || ''
                // console.log(url);
                if (url) {
                    let res2 = await request({
                        url: url,
                        method: 'get',
                        followRedirect: false
                    });
                    url = res2.headers.location;

                    // 第一种方式，URL，只支持M关注有礼
                    if (/shopId=[\d]+/.test(url)) {
                        let commond = `export ${envName}="${url}"`;
                        // console.log(commond)
                        await s.inlineSugar(commond);
                    }

                    // 第二种方式 支持慈善家店铺关注有礼 M关注有礼
                    // let shopId = getQueryString(url, 'shopId');
                    // // console.log(shopId);
                    // let venderId = await getVenderId(shopId);
                    // // console.log(venderId);
                    // if (shopId && venderId) {
                    //     let commond = `export ${envName}="${shopId}_${venderId}"`;
                    //     console.log(commond)
                    //     await s.inlineSugar(commond);
                    // }
                }

            }
        }
    }
    catch (e) {
    }
    return 'next';
}

function getQueryString(url, name) {
    let reg = new RegExp('([?&])' + name + '=([^&]+)');
    let r = url.match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return '';
}

function generateRandomString(length) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}


async function getVenderId(shopId) {
    let data = await request({
        url: `https://api.m.jd.com/client.action?functionId=whx_getMShopOutlineInfo&body={"shopId":${shopId},"source":"m-shop"}&appid=shop_view&clientVersion=11.0.0&client=wh5`,
        headers: {
            "origin": "https://shop.m.jd.com",
            "referer": "https://shop.m.jd.com/",
            "user-agent": USER_AGENT(),
            "cookie": `pt_key=${generateRandomString(42)};pt_pin=jd_${generateRandomString(10)};`
        },
        json: true
    })
    // console.log(data.body)
    if (data.body)
        return data.body.data?.shopInfo?.venderId || ''
    else
        return ''
}