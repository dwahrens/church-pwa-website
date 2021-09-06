const email = require('../lib/email')
const settings = require('../lib/appSettings').getSettings()

/**
 * sendMessage - Simple function to take a name, valid email and message and forwards it to the right people.
 * @param {*} req - Express Request 
 * @param {*} res - Express Response
 */
exports.sendMessage = (req, res) => {
  let data = req.body
  let error = false
  if (data.honey.length === 0) {
    if (!(data.name.length > 0)) {
      error = true
      res.send({ error: true, message: 'Please enter your name.' })
    }
    if (!(data.email.indexOf('@') !== -1 && data.email.indexOf('.') !== -1)) {
      error = true
      res.send({ error: true, message: 'Please enter a valid email address.' })
    }
    if (!(data.message.length > 0)) {
      error = true
      res.send({ error: true, message: 'Please enter a message.' })
    }
    if (data.message.length > 250) {
      error = true
      res.send({ error: true, message: 'Please do not enter more than 250 characters.' })
    }
    if (data.message.indexOf('href=') > -1 || data.message.indexOf('http') > -1 || data.message.indexOf('www') > -1) {
      error = true
      res.send({ error: true, message: 'Links to websites are not allowed.' })
    }
    if (!error) {
      // Get the Inquiry emails from the Settings
      var emails = settings.appInquiryEmail
      var subject = settings.appName + ' - New Inquiry from ' + settings.domain
      var text = 'Name: ' + data.name + '\r\nEmail: ' + data.email + '\r\nMessage: ' + data.message
      var html = 'Name: ' + data.name + '<br/>Email: ' + data.email + '<br/>Message: ' + data.message
      var customId = 'NewInquiry'
      email.sendMail(emails, text, html, subject, customId, (results) => {
        if (results.body === 400) {
          res.send({ error: true, message: 'We did not receive your message, please try again later.' })
        } else {
          res.send({ success: true, message: 'We received your message and will respond soon!'})
        }
      })
    }
  } else {
    res.send({ error: true, message: 'There was an error in your submission. Please try again later.'})
  }
}