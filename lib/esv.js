const https = require('https')
const settings = require('./appSettings').getSettings()
const APIKey = settings.esvKey
let options = {
  host: 'api.esv.org',
  port: 443,
  headers: {
    'Authorization': 'Token ' + APIKey
  }
}
/**
 * getPassageHTML - returns a passage HTML from esv.org
 * @param {*} passage - example format: Ephesians 1:1-14 
 * @param {*} next 
 */
exports.getPassageHTML = (passage) => {
  return new Promise((resolve, reject) => {
    if (APIKey) {
      options.path = '/v3/passage/html/?q=' + passage.replace(/ /g, '%20') + '&include-footnotes=false&include-headings=false&include-subheadings=false'
      https.get(options, function (res) {
        var body = ""
        res.on('data', function (data) {
          body += data
        })
        res.on('end', function () {
          //here we have the full response, html or json object
          resolve(JSON.parse(body))
        })
        res.on('error', function (e) {
          reject(e)
        })
      })
    } else {
      reject("No API KEY Available.")
    }
  })
}

/**
 * getPassageText - returns a passage Text from esv.org
 * @param {*} passage - example format: Ephesians 1:1-14 
 * @param {*} next 
 */
exports.getPassageText = (passage) => {
  return new Promise((resolve, reject) => {
    options.path = '/v3/passage/text/?q=' + passage.replace(/ /g, '%20') + '&include-footnotes=false&include-headings=false&include-subheadings=false'
    https.get(options, function (res) {
      var body = ""
      res.on('data', function (data) {
        body += data
      });
      res.on('end', function () {
        resolve(JSON.parse(body))
      })
      res.on('error', function (e) {
        reject(e)
      })
    })
  })
}
