/**
 * @author 小寒寒
 * @name 美团登录
 * @description 美团登录
 * @rule ^(美团登录|登录美团)$
 * @version 1.0.1
 * @priority 1000
 * @admin false
 * @origin 小寒寒
 * @disable false
 */

const qlNum = 0; // 取哪个容器的ck
const envName = 'meituanCookie'; //适配萝卜和拉菲的脚本
module.exports = async (s) => {
    const QlMod = require('../红灯区/mod/AmQlMod.js');
    let qlDb = await QlMod.GetQlDataBase();
    let qlDbArr = qlDb['data'] || [];
    if (qlDbArr.length == 0) return s.reply('请先发“面板管理”添加面板');
    await s.reply(`请访问以下链接，登录之后右上角复制链接：\nhttps://passport.meituan.com/useraccount/ilogin?`);
    await s.reply(`请在90秒内粘贴登录后的链接：`);
    let input = await s.waitInput(() => { }, 90);
    let url = input?.getMsg();
    s.delMsg(input.getMsgId());
    if (url.match(/https:\/\/i\.meituan\.com\/account\/\?[\S]+userId=[\d]+&token=[\S]+/)) {
        let token = getQueryString(url, 'token');
        let userid = getQueryString(url, 'userId');
        const userId = await s.getUserId();
        let remarks = userId + "@" + userid;
        let cookies = await QlMod.SearchQlEnvs(qlDbArr, qlNum, encodeURIComponent(remarks));
        if (cookies.data.length > 0) {
            let t = cookies.data[0];
            QlMod.EditQlEnvs(qlDbArr, qlNum, {
                "value": token, //变量
                "name": envName,   //变量名
                "remarks": t.remarks, //备注
                "id": t.id ? t.id : t._id  //id或_id
            });
            msg = `${userid}美团更新账号成功~`;
        } else {
            QlMod.AddQlEnvs(qlDbArr, qlNum, [{
                "value": token,
                "name": envName,   //变量名
                "remarks": remarks //备注
            }]);
            msg = `${userid}美团上车成功~`;
        }
        await s.reply(msg);
    }
    else {
        await s.reply(`输入的链接有误，请重新登录提取！`);
    }
}

function getQueryString(url, name) {
    let reg = new RegExp('(^|&|)' + name + '=([^&]*)(&|$)', 'i');
    let r = url.match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return '';
}