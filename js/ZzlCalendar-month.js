/**
 * 日历
 * @param {IDString} 追加日历的容器
 * @param {Object} 配置项
 * 
 * 兼容到IE9以上
 * 更新：2019-3-25
 * 作者：张中乐
 */
function ZzlCalendarMonth (domId, options) {
	var that = this
	this.zconf = {
		showLunarCalendar: false, //是否显示阴历日期
		handlerId: 'zcalendar' // 最外层id
		// opacityId: 'zcalendar-opacity', // 遮罩id
	};
	this.defindeOption1 = []
	// 合并配置项
	for(v in this.zconf){
		for(b in options){
			if(v==b){
				this.zconf[v]=options[b];
			}
		}
	}
	

	// 最外层id，多个日历时用来区分当前日历
	this.handlerId = this.zconf.handlerId ? document.getElementById(this.zconf.handlerId) : false;
	// 日历所追加的位置Dom
	this.myCalendar = document.getElementById(domId)
	// 初始化日期
	this.nowDate = new Date()
	
	
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
		if (document.getElementById('tab' + this.year + this.month)) {
			return
		} else {
			// console.log('首次渲染' + this.year + '年' + this.month + '月日历')
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
					var emptyObj = new Date(this.year + '-' + (this.month * 1 + 1))
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
						
						calendarHTML += '<dd class="zcalendar-td" id="col' + this.year + '-' + this.month + '-' + (nd - this.day + 1) + '"><dl class="zcalendar-date"><dt class="zcalendar-solar">'+ (nd - this.day + 1) +'</dt>' + zlunarHTML + '</dl><div class="zcalendar-define">' + defindeHTML + '</div></dd>'
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
		/*var tabHTML = '<div class="zcalendar-inactive zcalendar-active" id="tab' + this.year + this.month + '" >'
		
		tabHTML += calendarHTML
		tabHTML += '</div>'*/
		
		
		var tabHTML = '<div class="zcalendar-item" id="tab' + this.year + this.month + '" >\
			<div class="zcalendar-header">\
				<dl class="zcalendar-headerLeft">\
					<dt class="zcalendar-result">\
						<div class="" id="setDate">'
						tabHTML += this.year + '年' + this.month + '月'
						tabHTML += '</div>\
					</dt>\
				</dl>\
			</div>\
			<div class="zcalendar-body" id="zcalendarBody">'
		tabHTML += calendarHTML
		tabHTML += '<div class="clear"></div></div></div>'
		
		
		
		// this.myCalendar.innerHTML = calendarHTML
		var DOMArray = []
		DOMArray = parseToDOM(tabHTML)
		for(var m = 0; m < DOMArray.length; m++) {
			var mdom = DOMArray[m].cloneNode(true);
			this.myCalendar.appendChild(mdom)
		}
		this.appendStaute (this.defindeOption1)
	}
	
	/**
	 * 追加状态（小熊）支持文本,支持标签及样式和className
	 * @param {Array} 数组内包含对象（json）,如[{site: '2015-10-2', type: 1, text: '文本1'}, {site: '2015-1-12', type: 2, text: '<标签 class="" style=""></标签>'}]
	 */
	this.appendStaute = function (defindeOption) {
		for (var i = 0; i < defindeOption.length; i++) {
			if (this.year == defindeOption[i].site.split('-')[0] && this.month == defindeOption[i].site.split('-')[1]) { // 仅追加当年当月状态，非当年当月的无效
				document.getElementById('col' + defindeOption[i].site).getElementsByClassName('zcalendar-date')[0].className = 'zcalendar-date zcalendar-define' + defindeOption[i].type
				// if (defindeOption[i].text) {
					// document.getElementById('col' + defindeOption[i].site).getElementsByClassName('zcalendar-define')[0].innerHTML = defindeOption[i].text
				// }
			}
		}
	}
	
	/**
	 * 计算月
	 * @param {Object} s 起始时间
	 * @param {Object} e 截止时间
	 * @param {Object} a 返回的数组
	 */
	this.startEndMonth = function (s, e, a ){
		var sDate = new Date(s)
		var eDate = new Date(e)
		var arr = a && a.length >= 0 ? a : []
		if (sDate * 1 > eDate * 1) {
			if ((sDate.getMonth() - 1) != eDate.getMonth()) arr.push(eDate.getFullYear() + '-' + (sDate.getMonth() + 1))
			return arr
		} else {
			arr.push(sDate.getFullYear() + '-' + (sDate.getMonth() + 1))
			sDate.setTime(sDate.setMonth(sDate.getMonth() + 1))
			return arguments.callee((sDate.getFullYear() + '-' + (sDate.getMonth() + 1)), e, arr)
		}
	}
	
	/**
	 * 计算天
	 * @param {Object} s 起始时间
	 * @param {Object} e 截止时间
	 * @param {Object} t 类型
	 * @param {Object} a 返回的数组
	 */
	this.startEndDate = function (s, e, t, a){
		var sDate = new Date(s)
		var eDate = new Date(e)
		var arr = a && a.length >= 0 ? a : []
		if (sDate * 1 > eDate * 1) {
			return arr
		} else {
			arr.push({'site': sDate.getFullYear() + '-' + (sDate.getMonth() + 1) + '-' + sDate.getDate(), type: t})
			sDate.setTime(sDate.setDate(sDate.getDate() + 1))
			return arguments.callee((sDate.getFullYear() + '-' + (sDate.getMonth() + 1) + '-' + sDate.getDate()), e, t, arr)
		}
	}

	/**
	 * @param {Date} start 起始时间  demo 2019-4-5
	 * @param {Date} end 截止时间  demo 2019-6-20
	 * @param {Number} type 样式类型 demo 1,2
	 */
	this.renderStyle = function (start, end, type) {
		this.defindeOption1 = this.startEndDate(start, end, type)
		var MonthArr = this.startEndMonth(start, end)
		for (var m = 0; m < MonthArr.length; m++) {
			this.RenderCalendar(MonthArr[m].split('-')[0],MonthArr[m].split('-')[1])
		}
	}
	
}