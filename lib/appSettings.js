const fs = require('fs')
const fileName = 'settings.json'
const fileSettings = null
try {
  if (fs.existsSync(fileName)) {
    fileSettings = JSON.parse(fs.readFileSync(fileName, 'utf8'))
  }
} catch (err) {

}

let getSettings = () => {
  // bunch of conditionals to determine what the defaults should be used. Start with the environment variables, then the settings.json and then hardcoded defaults
  let settings = {
      appName: process.env.APP_NAME ? process.env.APP_NAME : fileSettings && fileSettings.appName ? fileSettings.appName : "DEMO CHURCH APP",
      appSessionSecret: process.env.APP_SESSION_SECRET ? process.env.APP_SESSION_SECRET : fileSettings && fileSettings.appSessionSecret ? fileSettings.appSessionSecret : "changeme",
      appKey: process.env.APP_KEY ? process.env.APP_KEY : fileSettings && fileSettings.appKey ? fileSettings.appKey : "changemetoo",
      appDb: process.env.APP_DB ? process.env.APP_DB : fileSettings && fileSettings.appDb ? fileSettings.appDb : "church",
      appDbServer: process.env.APP_DB_SERVER ? process.env.APP_DB_SERVER : fileSettings && fileSettings.appDbServer ? fileSettings.appDbServer : "localhost",
      appDbUser: process.env.APP_DB_USER ? process.env.APP_DB_USER : fileSettings && fileSettings.appDbUser ? fileSettings.appDbUser : "church",
      appDbPassword: process.env.APP_DB_PASSWORD ? process.env.APP_DB_PASSWORD : fileSettings && fileSettings.appDbPassword ? fileSettings.appDbPassword : "church",
      appEmail: process.env.APP_EMAIL ? process.env.APP_EMAIL : fileSettings && fileSettings.appEmail ? fileSettings.appEmail : "app@demo.net",
      appDonationEmail: process.env.APP_DONATION_EMAIL ? process.env.APP_DONATION_EMAIL : fileSettings && fileSettings.appDonationEmail ? fileSettings.appDonationEmail : "app@demo.net",
      appRegistrationEmail: process.env.APP_REGISTRATION_EMAIL ? process.env.APP_REGISTRATION_EMAIL : fileSettings && fileSettings.appRegistrationEmail ? fileSettings.appRegistrationEmail : "app@demo.net",
      appSupportEmail: process.env.APP_SUPPORT_EMAIL ? process.env.APP_SUPPORT_EMAIL : fileSettings && fileSettings.appSupportEmail ? fileSettings.appSupportEmail : "app@demo.net",
      appInquiryEmail: process.env.APP_INQUIRY_EMAIL ? process.env.APP_INQUIRY_EMAIL : fileSettings && fileSettings.appInquiryEmail ? fileSettings.appInquiryEmail : "app@demo.net",
      appPrayerEmail: process.env.APP_PRAYER_EMAIL ? process.env.APP_PRAYER_EMAIL : fileSettings && fileSettings.appPrayerEmail ? fileSettings.appPrayerEmail : "app@demo.net",
      churchName: process.env.APP_CHURCH_NAME ? process.env.APP_CHURCH_NAME : fileSettings && fileSettings.churchName ? fileSettings.churchName : "Demo Church Name",
      domainName: process.env.HOSTNAME ? process.env.HOSTNAME : fileSettings && fileSettings.domainName ? fileSettings.domainName : "demo.net",
      mailApiKey: process.env.MAIL_API_KEY ? process.env.MAIL_API_KEY : fileSettings && fileSettings.mailApiKey ? fileSettings.mailApiKey : "",
      mailDomain: process.env.MAIL_DOMAIN ? process.env.MAIL_DOMAIN : fileSettings && fileSettings.mailDomain ? fileSettings.mailDomain : "",
      esvKey: process.env.ESV_KEY ? process.env.ESV_KEY : fileSettings && fileSettings.esvKey ? fileSettings.esvKey : "",
      saltRounds: process.env.SALT_ROUNDS ? process.env.SALT_ROUNDS : fileSettings && fileSettings.saltRounds ? fileSettings.saltRounds : 13,
      hash: process.env.HASH ? process.env.HASH : fileSettings && fileSettings.hash ? fileSettings.hash : "",
      ivLength: process.env.IV_LENGTH ? process.env.IV_LENGTH : fileSettings && fileSettings.ivLength ? fileSettings.ivLength : 16,
      port: process.env.PORT ? process.env.PORT : fileSettings && fileSettings.port ? fileSettings.port : 3000,
  }
  return settings
}

module.exports.getSettings = getSettings