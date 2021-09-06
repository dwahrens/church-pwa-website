const mailgun = require("mailgun-js")
const settings = require('./appSettings').getSettings()

exports.sendMail = (emails, plainText, html, subject, customId, next) => {
	const mg = mailgun({apiKey: settings.mgApiKey, domain: settings.mgDomain })
	const data = {
		from: 'No Reply <' + settings.appEmail + '>',
		to: emails,
		subject: subject,
		text: plainText,
		html: html
	}
	mg.messages().send(data, function (error, body) {
		if (error) throw new Error(error)
		if (next) {
			next(body)
		}
	})
}

