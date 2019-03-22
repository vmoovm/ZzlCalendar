/*
 * 
 * 12：00：00～23：59：59时段指下午。
 * 0：00：00～11：59：59时段指上午
 */
function ZzlTime (domId, options) {
	var that = this
	var isInit = true // 一次变量，首次渲染不执行
	this.zconf = {
		initTime: null, // 指定初始小时分钟，默认为现在, 可赋值为  12:16, 16:56
		setTime: 'setTime', // 暂存时间
		isJumpDate: true, // 是否允许翻小时分钟
		prevHourId: 'prevHour', // 上翻年id
		nextHourId: 'nextHour', // 下翻年id
		prevMinuteId: 'prevMinute', // 上翻月id
		nextMinuteId: 'nextMinute', // 下翻月id
		type: 'am', // am: 上午，pm：下午
		onSelect: function () {}, // 选择分钟事件
		onBack: function () {}, // 返回或者退出事件，点此按钮触发
		onComplete: function () {} // 完成事件，完成时间选择，点此按钮时触发
	}
	// 合并配置项
	for(k in this.zconf){
		for(d in options){
			if(k = d){
				this.zconf[k]=options[d]
			}
		}
	}
	this.myTime = document.getElementById(domId)
	// 初始化日期
	this.nowDate = new Date()
	
	/**
	 * 渲染时间表
	 */
	this.renderHtml = function () {
		var defindeHTML = '<p></p>'
		var timeHTML = '<div class="ztime-header">\
							<dl class="ztime-headerLeft">\
								<dd class="ztime-prevHour" id="prevHour"></dd>\
								<dd class="ztime-prevMinute" id="prevMinute"></dd>\
								<dt class="ztime-result ztime-white">\
									<div class="" id="setTime">\
										<span data-hour="23" data-minute="10">23 : 10</span>\
									</div>\
								</dt>\
								<dd class="ztime-nextMinute" id="nextMinute"></dd>\
								<dd class="ztime-nextHour" id="nextHour"></dd>\
							</dl>\
							<p class="ztime-headerRight ztime-gray" id="ztimeNow">现在</p>\
						</div>\
						<div class="ztime-body">'
		// 拼HTML小时
		timeHTML += '<div class="ztime-hourBox ztime-line">\
						<ul class="ztime-ampm" id="ztime-ampm">\
							<li class="zcur"><span>上午</span></li>\
							<li><span>下午</span></li>\
						</ul>\
						<div class="ztime-hourContent">\
							<dl class="ztime-tr">'
		for( var i = 0; i < 12; i++) {
			if (i != 0 && i % 6 == 0) {
				timeHTML += '</dl><dl class="ztime-tr">'
			}
			timeHTML += '<dt class="ztime-th" id="hour' + (i * 1 + 1) + '">\
							<dl class="ztime-hour">\
								<dt>' + (i * 1 + 1) + '<span>时</span></dt>\
							</dl>\
						</dt>'
		}
		timeHTML += '</dl>'
		timeHTML += '</div></div>'
		timeHTML += '<dl class="ztime-tr ztime-darker">'
		for (var m = 0; m < 60; m++) {
			if (m != 0 && m % 8 == 0) {
				timeHTML += '</dl><dl class="ztime-tr ztime-darker">'
				// timeHTML += m == 55 ? '</dl><dl class="ztime-tr ztime-darker">' : '</dl><dl class="ztime-tr ztime-darker">'
			}
			var temp = m < 10 ? ('0' + m) : m
			timeHTML += '<dd class="ztime-td" id="minute' + m + '">\
						<dl class="ztime-minute">\
							<dt class="ztime-point">' + temp + '</dt>\
							<dd class="ztime-unit">分</dd>\
						</dl>\
						<div class="ztime-define">\
							<p></p>\
						</div>\
					</dd>'
		}
		timeHTML += '</dl>'
		timeHTML += '</div>'
		timeHTML += '<div class="ztime-btn">\
				<p class="ztime-back" id="ztime-back">←</p>\
				<p class="ztime-complete" id="ztime-complete">确定</p>\
			</div>'
		
		this.myTime.innerHTML = timeHTML
		if (this.zconf.RenderHtmlFn && !isInit) {
			this.zconf.RenderHtmlFn() // 时间表渲染完成
		}
		isInit = false
		document.getElementById("ztimeNow").addEventListener('click', function () {
			that.toNow()
		})
		// 初始化显示时间Dom
		this.setTime = this.zconf.setTime ? document.getElementById(this.zconf.setTime) : false;
		var childElesMinute = this.myTime.getElementsByClassName('ztime-td')
		for (var n = 0; n < childElesMinute.length; n++) {
			// 注册绑定事件
			if (!(RegExp(' ztime-stop ').test(' ' + childElesMinute[n].className + ' '))) {
				childElesMinute[n].addEventListener('click', function (e) {
					that.zconf.onSelect({
						id: this.id, // 返回当前点击元素的id
						type: 2 // 状态2为分钟事件 , 1为小时事件
					})
					that.minute = this.id.slice(6)
					that.syncTimeDom(that.hour, that.minute)
				}, false)
			}
		}
		childElesMinute = null
		var childElesHour = this.myTime.getElementsByClassName('ztime-th')
		for (var n = 0; n < childElesHour.length; n++) {
			// 注册绑定事件
			if (!(RegExp(' ztime-stop ').test(' ' + childElesHour[n].className + ' '))) {
				childElesHour[n].addEventListener('click', function (e) {
					that.zconf.onSelect({
						id: this.id, // 返回当前点击元素的id
						type: 1 // 状态2为分钟事件 ,1为小时事件
					})
					console.log(this.id.slice(4))
					if (that.zconf.type == 'am') {
						that.hour = this.id.slice(4)
					} else if (that.zconf.type == 'pm') {
						that.hour = 12 + this.id.slice(4) * 1
					}
					if (that.hour == 24) that.hour = 0
					that.syncTimeDom(that.hour, that.minute)
				}, false)
			}
		}
		childElesHour = null
		
		// 获取上午下午按钮
		this.TypeBtn = document.querySelector("#ztime-ampm").querySelectorAll('li')
		
		// 与上午按钮绑定更新事件
		this.TypeBtn[0].addEventListener('click', function () {
			that.TypeBtn[0].classList.add('zcur')
			that.zconf.type = 'am'
			that.TypeBtn[1].classList.remove('zcur')
			if (that.hour >= 12) {
				that.hour = that.hour - 12
				getTimeType(that.hour)
				that.syncTimeDom()
			}
		}, false)
		
		// 与下午按钮绑定更新事件
		this.TypeBtn[1].addEventListener('click', function () {
			that.TypeBtn[1].classList.add('zcur')
			that.zconf.type = 'pm'
			that.TypeBtn[0].classList.remove('zcur')
			if (that.hour <= 12) {
				that.hour = that.hour * 1 + 12
				if (that.hour > 23) {
					that.hour = 0
				}
				getTimeType(that.hour)
				that.syncTimeDom()
			}
		}, false)
		
		// 返回或者退出
		document.getElementById("ztime-back").addEventListener('click', function () {
			that.zconf.onBack()
		})
		
		// 选择完成
		document.getElementById("ztime-complete").addEventListener('click', function () {
			that.zconf.onComplete()
		})
		
	}
	this.renderHtml()
	
	/*
	 * 更新当前时间是上午还是下午
	 */
	var getTimeType = function (hour) {
		for (var r = 0; r < that.TypeBtn.length; r++) {
			that.TypeBtn[r].classList.remove('zcur')
		}
		if (hour >= 12) {
			that.zconf.type = 'pm'
			that.TypeBtn[1].classList.add('zcur')
		} else if (hour < 12) {
			that.zconf.type = 'am'
			that.TypeBtn[0].classList.add('zcur')
		}
		var seteHs = document.querySelectorAll('.ztime-setedHour')
		var seteMs = document.querySelectorAll('.ztime-setedMinute')
		for (var h = 0; h < seteHs.length; h++) {
			seteHs[h].classList.remove('ztime-setedHour')
		}
		for (var m = 0; m < seteMs.length; m++) {
			seteMs[m].classList.remove('ztime-setedMinute')
		}
		
		// 追加现在时间样式
		if (that.zconf.type == 'am') {
			console.log('#hour' + hour)
			if (hour == 0) {
				document.querySelector('#hour12').classList.add('ztime-setedHour')
			} else {
				document.querySelector('#hour' + hour).classList.add('ztime-setedHour')
			}
		} else if (that.zconf.type == 'pm') {
			if (hour == 12) {
				document.querySelector('#hour12').classList.add('ztime-setedHour')
			} else {
				document.querySelector('#hour' + (hour - 12)).classList.add('ztime-setedHour')
			}
		}
		if (that.minute == 60) {
			document.querySelector('#minute00').classList.add('ztime-setedMinute')
		} else {
			document.querySelector('#minute' + that.minute).classList.add('ztime-setedMinute')
		}
	}
	
	/**
	 * 与触发小时分钟DOM同步当前小时和分钟
	 * 初始化指定小时分钟时会用到，或者手动改变时间后，需要与DOM同步时会用到
	 */
	this.syncTimeDom = function () {
		if (!this.setTime) return
		this.setTime.setAttribute('data-hour', this.hour)
		this.setTime.setAttribute('data-minute', this.minute)
		this.setTime.innerText = ((this.hour < 10) ? ('0' + this.hour) : this.hour) + ' : ' + ((this.minute) < 10 ? ('0' + this.minute) : this.minute)
		console.log(this.hour)
	}
	this.syncTimeDom()
	/**
	 * 更新时间
	 */
	this.UpDateTime = function (hour, minute) {
		if (this.hour < 0) {
			console.log('负数小时为无意义操作')
			return
		}
		if (this.minute < 0 || this.minute > 59) {
			console.log('分钟只包含0-59，其他无效')
			return
		}
		this.hour = hour
		this.minute = minute
		
		getTimeType(this.hour)
	}
	
	this.UpDateTime(that.nowDate.getHours(), that.nowDate.getMinutes())
	
	/**
	 * 回到现在
	 */
	this.toNow = function () {
		console.log('回到现在')
		this.nowDate = new Date()
		getTimeType(this.nowDate.getHours())
		that.UpDateTime(that.nowDate.getHours(), that.nowDate.getMinutes())
		that.hour = that.nowDate.getHours()
		that.minute = that.nowDate.getMinutes()
		that.syncTimeDom()
	}
	
	// 是否有指定默认时间
	if (this.zconf.initTime) {
		this.UpDateTime(this.zconf.initTime.split(':')[0], this.zconf.initTime.split(':')[1])
		this.hour = this.zconf.initTime.split(':')[0]
		this.minute = this.zconf.initTime.split(':')[1]
		getTimeType(this.hour)
		this.syncTimeDom()
	} else {
		this.toNow()
	}
	
	/**
	 * 翻小时
	 * @param {Number} 正数正翻小时,负数负翻小时
	 */
	this.jumpHour = function (step) {
		this.hour = this.hour * 1 + step
		if (this.hour < 0) {
			this.hour = 23
		} else if (this.hour > 23) {
			this.hour = 0
		}
		// 翻月后再翻年至本年后,时间超出当月日期(补漏)
		if (this.zconf.isPastDate && this.hour + 1 > this.nowDate.getHours()) {
			this.minute = this.nowDate.getMinutes()
		} else if (this.zconf.isFutureDate && (this.hour == this.nowDate.getHours()) && this.minute < this.nowDate.getMinutes()) {
			this.minute = this.nowDate.getMinutes() + 1
		}
		this.UpDateTime(this.hour, this.minute)
		this.syncTimeDom()
		return this.hour
	}
	
	/**
	 * 翻分钟
	 * @param {Number} 正数正翻分钟,负数负翻分钟
	 */
	this.jumpMinute = function (step) {
		if (this.minute < 0 || this.minute > 59) return
		this.minute = this.minute * 1 + step
		console.log(this.minute)
		if (this.minute < 0) {
			this.minute = 59
			this.hour = this.hour * 1 - 1
		} else if (this.minute > 59) {
			this.minute = 0
			this.hour = this.hour * 1 + 1
		}
		if (this.hour < 0) {
			this.hour = 23
		} else if (this.hour > 23) {
			this.hour = 0
		}
		this.UpDateTime(this.hour, this.minute)
		this.syncTimeDom()
		return this.minute
	}
	
	if (this.zconf.isJumpDate) {
		if (!this.zconf.prevHourId) {
			console.log('上翻小时id为空')
			return false
		} else {
			document.getElementById(this.zconf.prevHourId).addEventListener('click', function () {
				that.jumpHour(-1)
			}, false)
		}
		if (!this.zconf.nextHourId) {
			console.log('下翻小时id为空')
			return false
		} else {
			document.getElementById(this.zconf.nextHourId).addEventListener('click', function () {
				that.jumpHour(1)
			}, false)
		}
		if (!this.zconf.prevMinuteId) {
			console.log('上翻分钟id为空')
			return false
		} else {
			document.getElementById(this.zconf.prevMinuteId).addEventListener('click', function () {
				that.jumpMinute(-1)
			}, false)
		}
		if (!this.zconf.nextMinuteId) {
			console.log('下翻分钟id为空')
			return false
		} else {
			document.getElementById(this.zconf.nextMinuteId).addEventListener('click', function () {
				that.jumpMinute(1)
			}, false)
		}
	}
}
