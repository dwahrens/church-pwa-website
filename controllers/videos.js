/* eslint-disable no-undef */
const ejs = require('ejs')
const path = require('path')
const cache = require('../lib/cache')
const secured = require('../lib/secured')
const yt = require('../lib/yt')
const users = require('../models/users')
const videoModel = require('../models/videos')

exports.addVideo = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let results = await videoModel.checkVideoExists(req.body.url).catch(e => { throw new Error(e) })
        if (results.length <= 0) {
          let data = req.body
          if (data.url.indexOf('youtube') > -1 || data.url.indexOf('youtu.be') > -1) {
            let url_id = (data.url.indexOf('?watch=') > -1) ? data.url.substring(data.url.indexOf('?watch='), data.url.length) : data.url.substring(data.url.lastIndexOf('/') + 1, data.url.length)
            let embedded_url = 'https://www.youtube-nocookie.com/embed/' + url_id
            let videoInfo = await yt.getInfo(data.url).catch(e => { throw new Error(e) })
            let set = {
              'url': data.url,
              'embedded_url': embedded_url,
              'title': '',
              'tag': parseInt(data.tag),
              'livestream': data.livestream,
              'private': data.private
            }
            // Handle if it is an unlisted video
            if (!videoInfo.error) {
              set.title = videoInfo.title
            }
            let addVideo = await videoModel.addVideo(set).catch(e => { throw new Error(e) })
            if (addVideo.insertId) {
              res.send({ success: true, message: 'Successfully added the Video', 'id': addVideo.insertId })
            } else {
              res.send({ error: true, message: 'Failed to add Video' })
            }
            cache.buildCache()
          } else {
            let set = {
              url: data.url,
              embedded_url: '',
              title: '',
              tag: parseInt(data.tag),
              livestream: data.livestream,
              private: data.private
            }
            let addVideo = await videoModel.addVideo(set).catch(e => { throw new Error(e) })
            if (addVideo.insertId) {
              res.send({ success: true, message: 'Successfully added the Video', 'id': addVideo.insertId })
            } else {
              res.send({ 'error': true, message: 'Failed to add Video' })
            }
            cache.buildCache()
          }
        } else {
          res.send({ 'error': true, message: 'Video already Exists' })
        }
    } else {
      res.send({ 'error': true, message: 'Access Denied' })
    }
  })
}

exports.updateVideo = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAuth = users.isAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let results = await videoModel.updateVideo(req.body).catch(e => { throw new Error(e) })
      if (results.affectedRows > 0) {
        res.send({ success: true, message: 'Updated Video.' })
      } else {
        res.send({ error: true, message: 'Failed to update the video.' })
      }
    } else {
      res.send({ error: true, message: 'Access Denied' })
    }
  })
}

exports.getWednesdayEveningPrayer = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAuth = users.isAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let results = await videoModel.getWednesdayEveningPrayer(req.body.latest).catch(e => { throw new Error(e) })
      res.send(results)
    } else {
      res.send({ 'error': true, message: 'Access Denied' })
    }
  })
}

exports.getDailyDevosBySeries = async (req, res) => {
  if (req.body.daily_devo_id) {
    let results = await videoModel.getDailyDevotionalsBySeries(10, null, req.body.daily_devo_id).catch(e => { throw new Error(e) })
    ejs.renderFile(path.join(__dirname, '../views/partials/daily-devos-list.ejs'), {dailyDevos: results}, null, (err, str) => {
      if (err) throw new Error(err)
      let returnData = {
        'results': true,
        'html': str
      }
      res.send(JSON.stringify(returnData))
      // str => Rendered HTML string
    })
  } else {
    res.send({ 'error': 'ERROR: Please include the Daily Devotional Series name.'})
  }
}

exports.getDailyDevos = async (req, res) => {
  let number = req.body.number ? req.body.number : null
  let series_id = req.body.series_id ? req.body.series_id : null
  if (req.body.daily_devo_id) {
    let id = req.body.daily_devo_id
    let results = await videoModel.getDailyDevotionalsBySeries(number, id, series_id).catch(e => { throw new Error(e) })     
    ejs.renderFile(path.join(__dirname, '../views/partials/daily-devos-list.ejs'), {dailyDevos: results}, null, function (err, str) {
      if (err) throw new Error(err)
      let returnData = {
        'results': true,
        'html': str
      }
      res.send(JSON.stringify(returnData))
      // str => Rendered HTML string
    })
  } else {
    res.send({ 'error': 'ERROR: Please include a Daily Devotional ID.'})
  }
}