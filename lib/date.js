exports.formatDate = (currentDate, format) => {
	var date = ''
	var tempDate = new Date(currentDate)
	if (tempDate) {
		let day = ("0" + tempDate.getDate()).slice(-2)
		let month = ("0" + (tempDate.getMonth() + 1)).slice(-2)
		let year = tempDate.getFullYear().toString()
		switch (format) {
			case 'MM/DD/YY':
				date = month + '/' + day + '/' + year.substring(year.length - 2, year.length)
				break
			case 'MM-DD-YYYY':
				date = month + '-' + day + '-' + year
				break
			case 'YYYY-MM-DD':
				date = year + '-' + month + '-' + day
				break
			case 'MM/DD/YYYY':
				date = month + '/' + day + '/' + year
		}
		return date
	} else {
		return false
	}
}

exports.formatTime = (time) => {
	return time.replace(/^0+/, '')
}

exports.getCalendarMatrix = (date) => {
    var calendarMatrix = []

    var startDay = new Date(date.getFullYear(), date.getMonth(), 1)
    var lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0)

    // Modify the result of getDay so that we treat Monday = 0 instead of Sunday = 0
    var startDow = (startDay.getDay()) % 7
    var endDow = (lastDay.getDay()) % 7

    // If the month didn't start on a Monday, start from the last Monday of the previous month
    startDay.setDate(startDay.getDate() - startDow)

    // If the month didn't end on a Sunday, end on the following Sunday in the next month
    lastDay.setDate(lastDay.getDate() + (6-endDow))

    var week = []
    while(startDay <= lastDay){
        week.push(new Date(startDay));
        if (week.length === 7){
          calendarMatrix.push(week);
          week = []
        }
        startDay.setDate(startDay.getDate() + 1)
    }

    return calendarMatrix
}