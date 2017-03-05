var express = require('express');
var superagent = require('superagent');
var datetimeUtil = require('./util/datetime');
var app = express();
app.get('/', function (req, res, next) {
    superagent.get('http://192.168.1.2/userRpm/WlanStationRpm.htm?Page=1')
        .set('Cookie', 'Authorization=Basic%20YWRtaW46MzgzNTIyNWN5; ChgPwdSubTag=')
        .set('Host', '192.168.1.2')
        .set('Referer', ' http://192.168.1.2/userRpm/WlanStationRpm.htm?Page=1')
        .end(function (err, sres) {
            if (err) {
                return next(err);
            }
            console.log(datetimeUtil.getNowFormatDate() + ' : 请求')
            var show = '======================<br>'
            var result = sres.text.replace('\n').toString().split('Array(')[2].toString().split(')')[0].toString().split('"')
                .filter(function (val) {
                    return val.indexOf('-') > 0
                })
                .map(function (val) {
                    show += 'MAC地址 : ' + val + '<br>'
                })
            show = '共有' + result.length + '台设备在线<br>' + show;
            res.send(show);
        });
});
app.listen(3000, function () {
    console.log('app is listening at port 3000');
});