
const encryption = require('./encryption')
const prayer = require("../models/prayer")
const alerts = require('../models/alerts')
const email = require('./email')
const settings = require('./appSettings').getSettings()

let sendPrayerRequestsNotification = async () => {
  let prayer_requests = await prayer.getAllUnotifiedPrayerRequests().catch(e => { throw new Error(e) })
  if (prayer_requests.length > 0) {
    let subject = settings.appName + ' - New Prayer Requests'
    let html = 'Hello, <br /><p>New Prayer Requests have been added to <a href="https://' + settings.domainName + '/public/prayer-requests">Church Website</a></p>'
    let text = 'Hello, \r\nNew Prayer Requests have been added to Church Website: '
    prayer_requests.forEach((pr) => {
      html += '<p>Name: <b>' + encryption.decrypt(pr.first_name) + ' ' + encryption.decrypt(pr.last_name) + '</b></p>'
      html += '<p>Prayer Request: <i>' + encryption.decrypt(pr.request) + '</i></p>'
      text += '\r\nName: ' + encryption.decrypt(pr.first_name) + ' ' + encryption.decrypt(pr.last_name)
      text += '\r\nPrayer Request: ' + encryption.decrypt(pr.request).replace('<br>', '\r\n') 
    })
    html += '<br><p>To view these and other prayer requests please navigate to the <a href="https://' + settings.domainName + '/public/prayer-requests">Prayer Wall</a></p>'
    text += '\r\n\r\nTo view these and other prayer requests please navigate to the Prayer Wall: https://' + settings.domainName + '/public/prayer-requests'
    let subscribers = await alerts.getNotificationSubscribers().catch(e => { throw new Error(e) })
    subscribers.forEach((row) => {
      var customId = row.email+'-prayer-notification'
      if (row.alerts === 1 && row.is_approved === 1 && row.email && row.email.length > 0) {
        email.sendMail(row.email.toString(), text, html, subject, customId)
        // Then Update the results set with notification set.
      }
    })
    await prayer.completeNotificationPrayerRequests(prayer_requests).catch(e => { throw new Error(e) })
    console.log('Sent Prayer Requests.')
  }
}

module.exports.sendPrayerRequestsNotification = sendPrayerRequestsNotification
