/**
 * @author 小寒寒
 * @name 青龙通知接口
 * @origin 小寒寒
 * @version 1.0.1
 * @description 青龙通知接口，需配置对接token，set SpyIsValid ql_token xxxx，自行需要修改推送群号
 * @public false
 * @priority 99
 * @disable false
 * @service true
 */

const SpyIsValid = new BncrDB('SpyIsValid');
const dayjs = require('dayjs');
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
    if (['东东农场', '京东价保', '互动消息检查', 'M银行卡支付有礼', '京东CK检测', 'M农场自动化',
      '京东试用待领取物品通知', 'WSKEY转换',
      '牛牛乐园合成',
      'M京东签到'
    ].includes(title)) {
      await sysMethod.push({
        platform: 'wxQianxun', // 平台
        groupId: 49230877656, // 群号
        msg: `${title}\n\n${message}`,
        type: 'text'
      });
    }
    //订阅变更和豆豆推个人微信
    if (title.indexOf('新增任务') > -1
      || (/\d+】\S*\d+京豆/.test(message) && title != 'M签到有礼')
      || (/天,\d+京豆/.test(message) && title == 'M签到有礼')
      || (/,已填地址/.test(message) && title != 'M试用有礼')) {
      await sysMethod.push({
        platform: 'wxQianxun', // 平台
        userId: 'jun812148374', // 个人id
        msg: `${title}\n\n${message}`,
        type: 'text'
      });
    }

    if (message.indexOf('export ') > -1 && title[0] == 'M') {
      let exptPattern = /export \S+=\"\S+\"/;
      let expt = exptPattern.exec(message)?.toString();

      let url = /https:\/\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\*\+,%;\=]*/.exec(expt)?.toString();
      if (url) {
        let activityId = getQueryString(url, 'activityId') || getQueryString(url, 'id');

        if (activityId) {
          let timer_activityIds = await SpyIsValid.get('timer_activityIds');
          const timer_before = await SpyIsValid.get('timer_before');
          if (message.indexOf('未开始') > -1) {
            let datePattern = /\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}\s?至/;
            let rlt = datePattern.exec(message)?.toString();
            if (rlt) {
              let startTime = new Date(rlt.slice(0, 19)).getTime();
              let cron = dayjs(startTime - timer_before * 1000).format('s m H D M *');
              if (!timer_activityIds[activityId]) {
                console.log(`spy定时插队 ${cron} ${expt}`);
                timer_activityIds[activityId] = cron;
                await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                await SpyIsValid.set('timer_activityIds', timer_activityIds);
                message += '\n\nBncr设置定时：' + cron;
              }
              else {
                message += '\n\nBncr已定时过了。';
              }
            }
          }
          else if (title.indexOf('M购物车锦鲤') > -1 && message.indexOf('开奖时间:') > -1) {
            let datePattern = /开奖时间:\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}/;
            let rlt = datePattern.exec(message)?.toString();
            if (rlt) {
              console.log(rlt.substr(5, 16));
              console.log(rlt.substr(5, 16) + ':00');
              let startTime = new Date(rlt.substr(5, 16) + ':00').getTime();
              let cron = dayjs(startTime - timer_before * 1000).format('s m H D M *');
              if (!timer_activityIds[activityId]) {
                console.log(`spy定时插队 ${cron} ${expt}`);
                timer_activityIds[activityId] = cron;
                await sysMethod.inline(`spy定时插队 ${cron} ${expt}`);
                await SpyIsValid.set('timer_activityIds', timer_activityIds);
                message += '\n\nBncr设置定时：' + cron;
              }
              else {
                message += '\n\nBncr已定时过了。';
              }
            }
          }
          else if (title.indexOf('M购物车锦鲤') > -1 && message.indexOf('已经开奖') > -1) {
            await SpyIsValid.set(activityId, '已经开奖');
            message += '\n\nBncr已标记：已经开奖';
          }
          else if (message.indexOf('活动已结束') > -1) {
            await SpyIsValid.set(activityId, '活动已结束');
            message += '\n\nBncr已标记：活动已结束';
          }
          else if (message.indexOf('垃圾或领完') > -1) {
            await SpyIsValid.set(activityId, '垃圾或领完');
            message += '\n\nBncr已标记：垃圾或领完';
          }
        }
      }
    }

    // tg推送全部日志
    await sysMethod.push({
      platform: 'tgBot',
      groupId: -1001805030658, // tg青龙日志群
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
  let reg = new RegExp('(^|&|)' + name + '=([^&]*)(&|$)', 'i');
  let r = url.match(reg);
  if (r != null) {
    return unescape(r[2]);
  }
  return '';
}