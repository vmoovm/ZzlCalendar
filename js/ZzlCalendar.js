/**
 * 日历
 * @param {IDString} 追加日历的容器
 * @param {Object} 配置项
 * 
 * 兼容到IE9以上
 * 更新：2019-3-4
 * 作者：张中乐
 */
function ZzlCalendar (domId, options) {
	var that = this
	var isInit = true // 一次变量，首次渲染不执行
	this.zconf = {
		showLunarCalendar: true, //是否显示阴历日期
		initDate: null, // 指定初始日历月份，默认为今天, 可赋值为  2018-10  2017-5
		disEvent: [], // 禁止绑定事件的日期，例：['2018-10-10', '2017-1-20']
		handlerId: 'zcalendar', // 最外层id
		// opacityId: 'zcalendar-opacity', // 遮罩id
		selectMonthId: 'setDate', // 必填项 选择年月份的元素id
		prevYearId: 'prevYear', // 上翻年id
		nextYearId: 'nextYear', // 下翻年id
		prevMonthId: 'prevMonth', // 上翻月id
		nextMonthId: 'nextMonth', // 下翻月id
		// ShowState: false, // 日历显示状态
		isJumpDate: true, // 是否允许翻年月
		isPastDate: false, // 是否只允许翻阅今天以前日期（禁止未来日期）
		isFutureDate: false, // 是否只允许翻阅今天以后的日期（禁止过去日期）
		// forward: 1, // 往前1年 可以是0年
		// backward: 1, // 往后1年  可以是0年
		selectType: 1, // 默认为1，1为单选模式，2为多选模式
		showTagName: false, // 选择月份后，时间要显示的元素，具体标签，一般为：span  em i p div li dd dt a 等
		onSelect: function () {}, // 日期选择事件
		RenderHtmlFn: function () {}, // 渲染当月日历html完成
		nothingDataFn: function () {}, // 禁止未来日期，上下翻年月时触发，返回年月
		notNnallowedDataFn: function () {}, // 禁止过去日期，上下翻年月时触发，返回年月
		hideFn: function () {} // 隐藏事件
	};
	// 合并配置项
	for(v in this.zconf){
		for(b in options){
			if(v==b){
				this.zconf[v]=options[b];
			}
		}
	}
	
	/**
	 * 获取所有子元素
	 * @param {Object} ele 父元素传dom对象
	 * 
	 */
	var getChildren = function (ele) { 
		var chid=ele.childNodes; 
		var eleMatch = []; 
		for(var i=0,l=chid.length;i<l;i++){ 
			if (chid[i].nodeType == 1) eleMatch.push(chid[i]);
		}
		return eleMatch; 
	}
	// 初始化仿IOSSelect触发选择月Dom
	this.selectMonthDom = this.zconf.selectMonthId ? document.getElementById(this.zconf.selectMonthId) : false;
	// 日历所追加的位置Dom
	this.myCalendar = document.getElementById(domId)
	// 初始化日期
	this.nowDate = new Date()
	// if (!this.selectMonthDom) {
		// console.error('没有传入触发年月id,  ' + '不能使用弹窗选择年份和月份');
	// }
	// 多选型按钮显示，单选型按钮隐藏
	if (this.zconf.selectType == 2) {
		document.getElementById('zcalendarBtn').style.display = 'block'
		document.getElementById('zcalendarBtn').getElementsByTagName('p')[0].addEventListener('click', function (e) {
			that.zconf.hideFn(e)
		}, false)
	}
	
	/**
	 * 与触发年份月份dom同步当前年份和月份
	 * 初始化指定年月份时会用到，或者手动改变日历后，需要与dom同步时会用到
	 */
	this.syncDateDom = function () {
		if (this.selectMonthDom) {
			// 有自定义显示时间的标签时
			if (this.zconf.showTagName) {
				for (var i = 0; i < getChildren(this.selectMonthDom).length; i++) {
					if (getChildren(this.selectMonthDom)[i].nodeName.toLocaleLowerCase() == this.zconf.showTagName.toLocaleLowerCase()) {
						getChildren(this.selectMonthDom)[i].setAttribute('data-year', this.year)
						getChildren(this.selectMonthDom)[i].setAttribute('data-month', this.month)
						getChildren(this.selectMonthDom)[i].innerText = this.year + '年' + this.month + '月'
					}
				}
			} else {
				this.selectMonthDom.setAttribute('data-year', this.year)
				this.selectMonthDom.setAttribute('data-month', this.month)
				this.selectMonthDom.innerText = this.year + '年' + (this.month) + '月'
			}
		}
	}
	this.syncDateDom()
	/**
	 * 将字符串转为DOM对象
	 * @param {String} str
	 * @return {Array}
	 */
	var parseToDOM = function (str){
		   var div = document.createElement("div");
		   if(typeof str == "string")
		       div.innerHTML = str;
		   return div.childNodes;
		}
	
	/**
	 * 渲染日历
	 */
	this.RenderCalendar = function (year, month) {
		this.year = year
		this.month = month
		if (document.querySelector('.zcalendar-active')) document.querySelector('.zcalendar-active').classList.remove('zcalendar-active')
		if (document.getElementById('tab' + this.year + this.month)) {
			document.getElementById('tab' + this.year + this.month).classList.add('zcalendar-active')
			return
		} else {
			console.log('首次渲染' + this.year + '年' + this.month + '月日历')
		}
		if (this.year < 1900) {
			console.log('1900年前为无意义操作')
			return
		}
		if (this.month < 1 || this.month > 12) {
			console.log('月份只包含1-12，其他为无效月份')
			return
		}
		
		// 取当月第一天周几
		this.day = new Date(this.year, this.month - 1, 1).getDay()
		// 当月总天数
		this.monthDays = 31 
		if (/^2/.test(this.month)) {
			// 是平年或闰年
			if (this.year % 400 == 0 || (this.year % 100 != 0 && this.year % 4 == 0)) {
				this.monthDays = 29
			} else {
				this.monthDays = 28
			}
		} else if (/^4|6|9|11$/.test(this.month)) {
			this.monthDays = 30
		}
		// 行数
		var row = Math.ceil((this.monthDays + this.day) / 7)
		var zlunarHTML = '' // 农历标签
		// 按年月日拼日历innerHTML
		var defindeHTML = '<p></p>'
		var calendarHTML = ''
		// 添加星期
		calendarHTML += '<dl class="zcalendar-tr zcalendar-line" data-week="">\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>日</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>一</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>二</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>三</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>四</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>五</dt></dl></dt>\
			<dt class="zcalendar-th"><dl class="zcalendar-week"><dt>六</dt></dl></dt>\
		</dl>'
		var nd = 0 // 计单元格数和作为日期显示(numberDay)
		for (var r = 0; r < row; r++) {
			calendarHTML += '<dl class="zcalendar-tr zcalendar-darker zcalendar-line">'
			for (var c = 0; c < 7; c++, nd++) {
				if (nd < this.day) { // 上月
					var emptyObj = new Date(new Date(this.year, this.month - 1, 1).setTime(new Date(this.year, this.month - 1, 1).setMonth(new Date(this.year, this.month - 1, 1).getMonth() - 1)))
					var emptyObj1 = new Date(new Date(this.year, this.month - 1, 1).setTime(new Date(this.year, this.month - 1, 1).setDate(new Date(this.year, this.month - 1, 1).getDate() - this.day + nd)))
					// 是否显示农历
					if (this.zconf.showLunarCalendar) {
						zlunarHTML = '<dd class="zcalendar-lunar">' + calendar.solar2lunar(emptyObj.getFullYear(), (emptyObj.getMonth() + 1), emptyObj1.getDate()).IDayCn + '</dd>'
					}
					calendarHTML += '<dd class="zcalendar-td zcalendar-light" id="wrn' + emptyObj.getFullYear() + '-' + (emptyObj.getMonth() + 1) + '-' + emptyObj1.getDate() + '"><dl class="zcalendar-date"><dt class="zcalendar-solar">'+ emptyObj1.getDate() +'</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
				} else if (nd >= (this.monthDays + this.day)) { // 下月
					var emptyObj = new Date(new Date(this.year, this.month + 1, 1).setTime(new Date(this.year, this.month + 1, 1).setMonth(new Date(this.year, this.month + 1, 1).getMonth() - 1)))
					// 是否显示农历
					if (this.zconf.showLunarCalendar) {
						zlunarHTML = '<dd class="zcalendar-lunar">' + calendar.solar2lunar(emptyObj.getFullYear(), (emptyObj.getMonth() + 1), (emptyObj.getDate() + nd - this.monthDays - this.day)).IDayCn + '</dd>'
					}
					calendarHTML += '<dd class="zcalendar-td zcalendar-light" id="wrn' + emptyObj.getFullYear() + '-' + (emptyObj.getMonth() + 1) + '-' + (emptyObj.getDate() + nd - this.monthDays - this.day) + '"><dl class="zcalendar-date"><dt class="zcalendar-solar">' + (emptyObj.getDate() + nd - this.monthDays - this.day) + '</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
				} else { // 当月
					// 区别当天时间
					if ((nd - this.day + 1) == this.nowDate.getDate()) {
						// 是否显示农历
						if (this.zconf.showLunarCalendar) {
							zlunarHTML = '<dd class="zcalendar-lunar">' + calendar.solar2lunar(this.year, this.month, (nd - this.day + 1)).IDayCn + '</dd>'
						}
						if (this.year == this.nowDate.getFullYear() && this.month == this.nowDate.getMonth() + 1) {
							zlunarHTML = '<dd class="zcalendar-lunar">今天</dd>'
							calendarHTML += '<dd class="zcalendar-td" id="col' + this.year + '-' + this.month + '-' + (nd - this.day + 1) + '"><dl class="zcalendar-date zcalendar-today"><dt class="zcalendar-solar">'+ (nd - this.day + 1) +'</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
						} else {
							calendarHTML += '<dd class="zcalendar-td" id="col' + this.year + '-' + this.month + '-' + (nd - this.day + 1) + '"><dl class="zcalendar-date"><dt class="zcalendar-solar">'+ (nd - this.day + 1) +'</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
						}
					} else {
						// 是否显示农历
						if (this.zconf.showLunarCalendar) {
							zlunarHTML = '<dd class="zcalendar-lunar">' + calendar.solar2lunar(this.year, this.month, (nd - this.day + 1)).IDayCn + '</dd>'
						}
						calendarHTML += '<dd class="zcalendar-td" id="col' + this.year + '-'  + this.month + '-' + (nd - this.day + 1) + '"><dl class="zcalendar-date"><dt class="zcalendar-solar">'+ (nd - this.day + 1) +'</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
					}
				}
			}
			calendarHTML += '</dl>'
		}
		var tabHTML = '<div class="zcalendar-inactive zcalendar-active" id="tab' + this.year + this.month + '" >'
		tabHTML += calendarHTML
		tabHTML += '</div>'
		// this.myCalendar.innerHTML = tabHTML
		var DOMArray = []
		DOMArray = parseToDOM(tabHTML)
		for(var m = 0; m < DOMArray.length; m++) {
			var mdom = DOMArray[m].cloneNode(true);
			this.myCalendar.appendChild(mdom)
		}
		
		// this.myCalendar.appendChild()
		// this.myCalendar.innerHTML = calendarHTML
		
		if (this.zconf.RenderHtmlFn && !isInit) {
			this.zconf.RenderHtmlFn() // 当月日历表渲染完成
		}
		isInit = false
		/**
		 * 获取所有 zcalendar-td 元素子节点
		 * @param {Object} ele 父元素
		 * @param {type} className样式名字
		 * 
		 */
		/*
		 * 暂时作废
		 *var userChildren = function (ele) {
			var chid=ele.childNodes; 
			var eleMatch = []; 
			for(var i=0,l=chid.length;i<l;i++){ 
				if (chid[i].nodeType == 1) eleMatch.push(chid[i]);
			}
			var eles = [];
			for (var c = 0; c < eleMatch.length; c++) {
				for (var j = 0; j < eleMatch[c].childNodes.length; j++) {
					for (var q = 0; q < eleMatch[c].childNodes[j].length; q++) {
						if (eleMatch[c].childNodes[j].childNodes[q].nodeType == 1) eles.push(eleMatch[c].childNodes[j].childNodes[q])
					}											
					// if (eleMatch[c].childNodes[j].nodeType == 1) eles.push(eleMatch[c].childNodes[j])
				}
			}
			return eles; 
		}*/
		// 给未来时间追加禁止绑定事件的样式名
		if (this.zconf.isPastDate && this.year == this.nowDate.getFullYear() && this.month == (this.nowDate.getMonth() + 1)) {
			for (var d = this.nowDate.getDate() + 1; d <= this.monthDays; d++) {
				document.getElementById('col' + this.year + '-'  + this.month + '-' + d).classList.add('zcalendar-stop')
			}
		}
		var childEles = this.myCalendar.getElementsByClassName('zcalendar-td')
		// var childEles = userChildren(this.myCalendar)
		for (var n = 0; n < childEles.length; n++) {
			// 给禁止日期段追加禁止绑定事件的样式名
			if (childEles[n].id && this.zconf.disEvent.indexOf(childEles[n].id.slice(3)) >= 0) {
				childEles[n].classList.add('zcalendar-stop')
			}
			// 注册绑定事件
			if (!(RegExp(' zcalendar-stop ').test(' ' + childEles[n].className + ' '))) {
				childEles[n].addEventListener('click', function (e) {
					that.date = this.id.slice(3).split('-')[2]
					that.zconf.onSelect({
						id: this.id, // 返回当前点击元素的id
						type: that.zconf.selectType // 单选和多选状态1为单选,2为多选
						
						// info: calendar.solar2lunar(this.id.slice(3).split('-')[0], this.id.slice(3).split('-')[1], this.id.slice(3).split('-')[2]),
						// year: that.year, // 返回当月的年份
						// month: that.month, // 返回当月的月份
						// e: e
					})
				}, false)
			}
		}
		childEles = null
	}
	
	/**
	 * 回到今天
	 */
	this.toToday = function () {
		console.log('回到今天')
		that.RenderCalendar(that.nowDate.getFullYear(), that.nowDate.getMonth() + 1)
		that.year = that.nowDate.getFullYear()
		that.month = that.nowDate.getMonth() + 1
		that.date = that.nowDate.getDate()
		// that.zconf.onSelect({
			// id: 'col' + that.year + '-' + that.month + '-' + that.date, // 返回当前点击元素的id
			// type: that.zconf.selectType // 单选和多选状态1为单选,2为多选
		// })
		that.syncDateDom()
	}
	
	// 是否有指定默认年份和月份
	if (this.zconf.initDate) {
		this.RenderCalendar(this.zconf.initDate.split('-')[0], this.zconf.initDate.split('-')[1])
		this.year = this.zconf.initDate.split('-')[0]
		this.month = this.zconf.initDate.split('-')[1]
		this.date = this.zconf.initDate.split('-')[2]
		this.syncDateDom()
	} else {
		this.toToday()
	}
	/**
	 * 追加状态（小熊）支持文本,支持标签及样式和className
	 * @param {Array} 数组内包含对象（json）,如[{site: '2015-10-2', type: 1, text: '文本1'}, {site: '2015-1-12', type: 2, text: '<标签 class="" style=""></标签>'}]
	 */
	this.appendStaute = function (defindeOption) {
		for (var i = 0; i < defindeOption.length; i++) {
			if (this.year == defindeOption[i].site.split('-')[0] && this.month == defindeOption[i].site.split('-')[1]) { // 仅追加当年当月状态，非当年当月的无效
				document.getElementById('col' + defindeOption[i].site).getElementsByClassName('zcalendar-define')[0].className = 'zcalendar-define zcalendar-define' + defindeOption[i].type
				if (defindeOption[i].text) {
					document.getElementById('col' + defindeOption[i].site).getElementsByClassName('zcalendar-define')[0].innerHTML = defindeOption[i].text
				}
			}
		}
	}
	
	/**
	 * 追加自定义状态
	 * @param {Array} 需传数组，如['2018-10-25', '2018-5-2']
	 * @param {String} 传字符html代码块， 如'<div class="zcalendar-warning"></div>'
	 * 
	 */
	this.appendDefind = function (defindeOption, htmlStr) {
		for (var i = 0; i < defindeOption.length; i++) {
			document.getElementById('col' + defindeOption[i]).appendChild(parseToDOM(htmlStr)[0].cloneNode())
		}
	}
	
	/**
	 * 翻年
	 * @param {Number} 正数正翻年,负数负翻年
	 */
	this.jumpYear = function (step) {
		// 与isPastDate配合使用
		if ((step > 0) && this.zconf.isPastDate && this.year + 1 > this.nowDate.getFullYear()) {
			if (this.zconf.nothingDataFn) this.zconf.nothingDataFn({year:this.year, type: 'year'})
			return
		} else if ((step < 0) && this.zconf.isFutureDate && (this.year - 1 < this.nowDate.getFullYear())) {
			if (this.zconf.notNnallowedDataFn) this.zconf.notNnallowedDataFn({year:this.year, type: 'year'})
			return
		}
		
		if (this.year < 1900) {
			this.year = 1900
		} else {
			this.year = this.year * 1 + step
			// 翻月后再翻年至本年后,时间超出当月日期(补漏)
			if (this.zconf.isPastDate && this.year + 1 > this.nowDate.getFullYear()) {
				this.month = this.nowDate.getMonth() + 1
			} else if (this.zconf.isFutureDate && (this.year == this.nowDate.getFullYear()) && this.month < this.nowDate.getMonth() + 1) {
				this.month = this.nowDate.getMonth() + 1
			}
		}
		this.RenderCalendar(this.year, this.month)
		this.syncDateDom()
		return this.year
	}
	
	/**
	 * 翻月
	 * @param {Number} 正数正翻月,负数负翻月
	 */
	this.jumpMoth = function (step) {
		if (this.month < 1 || this.month > 12) return
		if ((step > 0) && this.zconf.isPastDate && (this.year == this.nowDate.getFullYear()) && (this.month > this.nowDate.getMonth())) {
			if (this.zconf.nothingDataFn) this.zconf.nothingDataFn({month: this.month, type: 'month'})
			return false
		} else if ((step < 0) && this.zconf.isFutureDate && (this.year == this.nowDate.getFullYear()) && (this.month <= this.nowDate.getMonth() + 1)) {
			if (this.zconf.notNnallowedDataFn) this.zconf.notNnallowedDataFn({month: this.month, type: 'month'})
			return false
		}
		this.month = this.month * 1 + step
		if (this.month < 1) {
			this.month = 12
			this.year = this.year * 1 - 1
		} else if (this.month > 12) {
			this.month = 1
			this.year = this.year * 1 + 1
		}
		
		this.RenderCalendar(this.year, this.month)
		this.syncDateDom()
		return this.month
	}
	
	/**
	 * 反向读取选中日期
	 * @param {String} 日期字符串例2018-10-20
	 * 目前只支持单选
	 * 
	 */
	this.readDate = function (str) {
		console.log(str)
		this.year = str.split('-')[0]
		this.month = str.split('-')[1]
		this.date = str.split('-')[2]
		if (!document.getElementById('col' + str)) {
			this.RenderCalendar(this.year, this.month)
		} else {
			if (document.querySelector('.zcalendar-active')) document.querySelector('.zcalendar-active').classList.remove('zcalendar-active')
			document.getElementById('tab' + this.year + this.month).classList.add('zcalendar-active')
		}
		this.syncDateDom()
	}
	
	if (this.zconf.isJumpDate) {
		if (!this.zconf.prevYearId) {
			console.log('上翻年id为空')
			return false
		} else {
			document.getElementById(this.zconf.prevYearId).addEventListener('click', function () {
				that.jumpYear(-1)
			}, false)
		}
		if (!this.zconf.nextYearId) {
			console.log('下翻年id为空')
			return false
		} else {
			document.getElementById(this.zconf.nextYearId).addEventListener('click', function () {
				that.jumpYear(1)
			}, false)
		}
		if (!this.zconf.prevMonthId) {
			console.log('上翻年id为空')
			return false
		} else {
			document.getElementById(this.zconf.prevMonthId).addEventListener('click', function () {
				that.jumpMoth(-1)
			}, false)
		}
		if (!this.zconf.nextMonthId) {
			console.log('下翻年id为空')
			return false
		} else {
			document.getElementById(this.zconf.nextMonthId).addEventListener('click', function () {
				that.jumpMoth(1)
			}, false)
		}
	}
}