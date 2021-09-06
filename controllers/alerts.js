const email = require('../lib/email')
const secured =  require('../lib/secured')
const alertsModel = require('../models/alerts')
const usersModel = require('../models/users')
const settings = require('../lib/appSettings').getSettings()

exports.emailUsers = (req, res) => {
	//let request = JSON.parse(req.body)
	let request = req.body
	secured.check(req, res, async (req) => {
		let isAdmin = usersModel.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
		if (isAdmin) {
			var subject = settings.appName + ' - Notification'
			var customId = 'Notification'
			let users = await alertsModel.getNotificationSubscribers().catch(e => { throw new Error(e) })
			for(const user in users) {
				email.sendMail(user.email.toString(), request.message, request.message, subject, customId)
			}
		}
	})
}
/**
 * sendalert: Sends an alert via email to text message or email. Depends on user preferences.
 */
exports.sendalerts = (req, res) => {
	let message = req.body.message
	// Get all of the numbers
	secured.check(req, res, async (req) => {
		let isAdmin = usersModel.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
		if (isAdmin) {
			var subject = settings.appName + ' - Notification'
			var customId = 'Alert'
			let users = await alertsModel.getNotificationSubscribers().catch(e => { throw new Error(e) })
			for (const row in users) {
				if (row.text_alerts ===  1 && row.carrier !== 16) {
					email.sendMail(row.email.toString(), message, message, subject, customId)
					let carrier = await alertsModel.getTextEmail(row.carrier)
					email.sendMail(row.phone + carrier, message, message, subject, customId)
				} else if (row.text_alerts === 0 && row.carrierId === 16) {
					(message.indexOf('Please call the following') === -1) ? message += '<p>Please call the following people</p>' : null
					message += row.first_name + '<a href="tel:' + row.phone + '">' + row.phone + "</a>"
				} else if (row.text_alerts === 0) {
					email.sendMail(row.email, message, message, subject, customId)
				}
			}
		}
	})
	// app.locals.message = message;
	res.send(JSON.stringify(message))
}

/**
 * carriers: returns supported wireless carriers from the database.
 */
exports.carriers = async (req, res) => {
	let carriers = await alertsModel.getCarriers().catch(e => { throw new Error(e) })
	res.send(JSON.stringify(carriers))
}