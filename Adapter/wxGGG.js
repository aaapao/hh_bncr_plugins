/**
 * This file is part of the Bncr project.
 * @author 小寒寒
 * @name wxGGG
 * @origin 咕咕鸡
 * @version 1.0.0
 * @description wx适配器，适用于咕咕鸡
 * @adapter true
 * @public false
 * @disable false
 * @priority 2
 * @Copyright ©2023 Aming and Anmours. All rights reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * 
 * config.js配置
 * 
wxBot: {
     GGG:{
         enable: true,
         sendUrl: 'http://127.0.0.1:8080',
     }
}
 */

module.exports = async () => {
    if (!sysMethod.config.wxBot.GGG.enable) return sysMethod.startOutLogs('未启用GGG 退出.');
    let GGGUrl = sysMethod.config.wxBot.GGG.sendUrl;
    if (!GGGUrl) return console.log('姑姑鸡:配置文件未设置sendUrl');
    //这里new的名字将来会作为 sender.getFrom() 的返回值
    const wxGGG = new Adapter('wxGGG');

    // 包装原生require   你也可以使用其他任何请求工具 例如axios
    const request = require('util').promisify(require('request'));
    // wx数据库
    const qs = require('querystring');
    /**向/api/系统路由中添加路由 */
    router.get('/api/bot/GGG', (req, res) =>
        res.send({ msg: '这是Bncr GGG Api接口，你的get请求测试正常~，请用post交互数据' })
    );
    router.post('/api/bot/GGG', async (req, res) => {
        try {
            let body = decodeURIComponent(qs.stringify(req.body)).match(/\{.*\}/)[0];
            // console.log(body);
            body = JSON.parse(body);
            // console.log('消息类型:', body.Msgtype);
            if (body.Msgtype !== 1) return console.log(`拒收该消息:${body.content}`);
            let msgInfo = null;
            if (body.memberwxid) {
                //群
                msgInfo = {
                    userId: body.memberwxid || '',
                    userName: '',
                    groupId: body.wxid.replace('@chatroom', '') || '0',
                    groupName: '',
                    msg: body.content || '',
                    msgId: '',
                    fromType: `Social`,
                };
            }
            else {
                //私聊
                msgInfo = {
                    userId: body.wxid || '',
                    userName: '',
                    groupId: '0',
                    groupName: '',
                    msg: body.content || '',
                    msgId: '',
                    fromType: `Social`,
                };
            }
            msgInfo && wxGGG.receive(msgInfo);
            res.send({ status: 200, data: '', msg: 'ok' });
        } catch (e) {
            console.error('咕咕鸡消息接收器错误:', e);
            res.send({ status: 400, data: '', msg: e.toString() });
        }
    });

    wxGGG.reply = async function (replyInfo) {
        // console.log('replyInfo', replyInfo);
        let body = null;
        const to_Wxid = +replyInfo.groupId ? replyInfo.groupId + '@chatroom' : replyInfo.userId;
        switch (replyInfo.type) {
            case 'text':
                replyInfo.msg = replyInfo.msg.replace(/\n/g, '\r');
                body = {
                    'api': 1,
                    'towxid': to_Wxid,
                    'content': replyInfo.msg
                };
                break;
            case 'image':
            case 'video':
            case 'file':
                body = {
                    'api': 2,
                    'towxid': to_Wxid,
                    'content': replyInfo.path
                };
                break;
            case 'xml':
                body = {
                    'api': 3,
                    'towxid': to_Wxid,
                    'Picpath': replyInfo.path || '',
                    'content': replyInfo.msg
                };
            default:
                return;
        }
        body && (await requestGGG(body));
        // console.log('body', body);
        return ''; //reply中的return 最终会返回到调用者 wx没有撤回方法，所以没有必要返回东西
    };
    /* 推送消息方法 */
    wxGGG.push = async function (replyInfo) {
        return this.reply(replyInfo);
    };
    /* wx无法撤回消息 为空 */
    wxGGG.delMsg = () => { };
    /* 发送消息请求体 */
    async function requestGGG(body) {
        return (
            await request({
                url: `${GGGUrl}`,
                method: 'post',
                body: body,
                json: true
            })
        ).body;
    }
    return wxGGG;
};
