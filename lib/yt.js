const request = require('request')

exports.getInfo = (ytUrl) => {
  return new Promise((resolve, reject) => {
    let url = 'https://noembed.com/embed?url=' + ytUrl
    return request(url, (err, res, body) => {
      if (err) reject(err)
      if (res.statusCode === 200) {
        resolve(JSON.parse(body))
      } else {
        reject({ error: true, message: 'Did not resolve with 200'})
      }
    })
  })
}