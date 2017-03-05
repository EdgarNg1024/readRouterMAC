# readRouterMAC
利用NodeJs爬虫路由器管理网页获取当前在线设备
> 背景：没有智能路由器，也想在外面知道家里有没有人？由于合租的关系，如果舍友在的话，不太方便带女票回家，所以就有了这篇文章...利用node.js查看家里有多少台设备在线，就可以知道当前舍友是不是在家了。同时，延伸一下，也可以悄悄查岗男票、老公是否真得在家，或者孩子是否在家看电视（需要是智能电视）或者家里有没有人蹭网
> 废话少说，show you the code！

1. **原理解释**：利用node.js模拟登陆路由器管理界面，然后发起请求爬虫在线设备页面，数据处理即可！
2. **实验环境**：
  2.1 TP-LINK：软件版本1.0.1 Build 140325 Rel.63500n；硬件版本WR885N 1.0 00000000
  2.2 node.js：v6.9.5
3. **CODE**：
 3.1 获取当前路由器管理地址，一般都是192.168.1.1，实际的可以查看路由器上面的贴纸。然后打开抓包工具`Fiddler`准备抓包！
 
	3.2 输入密码，有的会需要输入账号，大同小异。登录后，你可以在Fiddler那里看到登录请求啦，然后就可以得到cookies了，如图2：
	![图1.png](http://upload-images.jianshu.io/upload_images/1598412-9b7e173edc5b700a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
	
	![图2.png](http://upload-images.jianshu.io/upload_images/1598412-6c60c15c315bff7e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
	  如果你是TP-Link的用户，那就恭喜你了，TP-Link的cookies貌似是不会变的。你只需要复制下来就能使用了，有点坑爹。其他路由器没实验过，大家可以试一下，如果cookies是会变的，就需要在代码上进行登录后，获取cookies，TP-Link不需要，所以我就省了这一步了，哈哈哈...

	3.3 打开设备在线页面，清空Fiddler请求页面，点击“刷新”按钮，即可查看请求及返回的报文，下面的红框就是设备的MAC地址了，如图3、图4；
	![图3.png](http://upload-images.jianshu.io/upload_images/1598412-c5f319008ef02b69.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

	![图4.png](http://upload-images.jianshu.io/upload_images/1598412-8dae009635b9d3f1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

	3.4 原材料拿到了，可以进行加工了！根据图4请求的报文，可以知道获取在线设备的请求属于Get请求，请求地址是`http://192.168.1.2/userRpm/WlanStationRpm.htm?Page=1`，此时我们可以用js库的`superagent`库发送Get请求。
	Ps：不同的路由器所需要的头部参数不同，可以先把所有的头部都放进去，然后一个个排除。
	``` js
	superagent.get('http://192.168.1.2/userRpm/WlanStationRpm.htm?Page=1')
	        .set('Cookie', 'Authorization=Basic%2NWN5; ChgPwdSubTag=')
	        .set('Host', '192.168.1.2')
	        .set('Referer', ' http://192.168.1.2/userRpm/WlanStationRpm.htm?Page=1')
	        .end(function (err, sres) {
	        });
	```

	3.5 此时即可看到图4返回的那堆报文，但是没有经过处理，对于我们来说不好理解，所以我们需要对返回的数据进行数据处理。由于TP-Link返回的是js格式，所以我就没有使用`cheerio`库进行处理了，直接用最原始的字符串处理数据了。如果小伙伴们返回的是HTML格式，那使用cheerio解释，那就更快了。以下是字符串处理的代码：
	``` js
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
	```

	3.6 到此为止，核心功能已经完成了。不过之前提到，我们是需要在家以外用的，所以我们需要一个服务，能够让程序接收到我们的请求，在这里我使用的是`Express`库，快捷方便：
	``` js
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
	```

	3.7 接下来，在电脑上输入localhost:3000，那就有你想要的结果啦！如图5：
等等，如果需要在外面也能请求到这个服务，暂时还不行，因为你不知道它的ip啊！此时，我们可以使用端口映射服务，一般的路由器都有的虚拟服务器功能。
	![图5](http://upload-images.jianshu.io/upload_images/1598412-278d0e297a64140c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


	3.8 搭建虚拟服务器。打开路由器管理页面，注册一个花生壳账号，登录后即可看到域名信息。如图6：
	![图6.png](http://upload-images.jianshu.io/upload_images/1598412-71d0e79036b55101.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

	3.9 此时，可以使用在手机上使用流量试试是否可以访问成功！
	Ps：请求时记得填上端口号
	![图7.png](http://upload-images.jianshu.io/upload_images/1598412-14d402bca65e2f5b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

	详细代码[点击这里](https://github.com/EdgarNg1024/readRouterMAC)，喜欢的请在github给个Star哈
还可以获取当前上传下载速度，在网时长，供各位小伙伴发掘了