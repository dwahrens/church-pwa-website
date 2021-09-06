const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const esv = require('../lib/esv')
const mp3Duration = require('mp3-duration')
const sermonsModel = require('../models/sermons')
const users = require('../models/users')
const videoModel = require('../models/videos')
const secured = require('../lib/secured')
const date = require('../lib/date')
const cache = require('../lib/cache')
const yt = require('../lib/yt')

/**
 * getSermonFiles - returns a stream to the mp3 file
 * @param {*} req
 * @param {*} res
 */
exports.getSermonFiles = (req, res) => {
  // should be driven by the settings table
  let file = __dirname + '/../static' + req.originalUrl.replace(/%20/g, ' ')
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file)
    const total = stat.size
    if (req.headers.range) {
      const range = req.headers.range
      const parts = range.replace(/bytes=/, '').split('-')
      const partialStart = parts[0]
      const partialEnd = parts[1]

      const start = parseInt(partialStart, 10)
      const end = partialEnd ? parseInt(partialEnd, 10) : total - 1
      const chunksize = end - start + 1
      const rstream = fs.createReadStream(file, { start: start, end: end })
      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mp3',
      })
      rstream.pipe(res)
    } else {
      res.writeHead(200, {})
      res.write(file, 'binary')
    }
  } else {
    res.send('Error - 404')
    res.end()
    // res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'audio/mpeg' });
    // fs.createReadStream(path).pipe(res);
  }
}

/**
 * downloadSermon - returns the file for download
 * @param {*} req
 * @param {*} res
 */
exports.downloadSermon = (req, res) => {
  const file = __dirname + '/../static' + req.originalUrl.replace('download-sermon', 'sermons').replace(/%20/g, ' ')
  const fileName = req.originalUrl.replace(/%20/g, ' ').substring(req.originalUrl.lastIndexOf('/') + 1, req.originalUrl.length)
  res.setHeader('Content-disposition', 'attachment; filename=' + fileName)
  res.setHeader('Content-type', 'audio/mp3')
  res.download(file)
}

/**
 * get-sermons can either get a set number of sermons or all of the sermons. Pagination needed?
 */
exports.getSermons = async (req, res) => {
  // default pagination number to 10
  let number = req.body.number > 0 ? req.body.number : 10
  if (req.body.startId !== undefined && req.body.startId !== null) {
    let response = await sermonsModel.getSermonsRange(number, req.body.startId).catch(e => { throw new Error(e) })
    sendResponse(response, res)
  } else {
    let response = sermonsModel.getAllSermons().catch(e => { throw new Error(e) })
    sendResponse(response, res)
  }
}

let sendResponse = async (sermons, res) => {
  let data = {
    sermons: [],
  }
  data.speakers = await sermonsModel.getAllSpeakers().catch(e => { throw new Error(e) })
  data.series = await sermonsModel.getAllSeries().catch(e => { throw new Error(e) })
  for (var i = 0; i < sermons.length; i++) {
    sermons[i].speaker = sermons[i].first_name + ' ' + sermons[i].last_name
    // Eventually have this hard coded file be part of the settings table
    sermons[i].downloadFile = '/download-sermon/' + sermons[i].file
    sermons[i].file = '/sermons/' + sermons[i].file.replace(/ /g, '%20')
    if (sermons[i].passage_start_id) {
      let start_passage = await sermonsModel.getPassage(sermons[i].passage_start_id).catch(e => { throw new Error(e) })
      sermons[i].passage_start = {
        book_name: start_passage[0].book_name,
        chapter: start_passage[0].chapter,
        verse: start_passage[0].verse,
      }
      sermons[i].passage = start_passage[0].book_name + ' ' + start_passage[0].chapter + ':' + start_passage[0].verse
      let end_passage = await sermonsModel.getPassage(sermons[i].passage_end_id).catch(e => { throw new Error(e) })
      sermons[i].passage_end = {
        book_name: end_passage[0].book_name,
        chapter: end_passage[0].chapter,
        verse: end_passage[0].verse,
      }
      if (
        sermons[i].passage_start.book_name === sermons[i].passage_end.book_name &&
        sermons[i].passage_start.chapter === sermons[i].passage_end.chapter &&
        sermons[i].passage_start.verse !== sermons[i].passage_end.verse
      ) {
        sermons[i].passage += '-' + sermons[i].passage_end.verse
      } else if (sermons[i].passage_start.book_name === sermons[i].passage_end.book_name && sermons[i].passage_start.chapter !== sermons[i].passage_end.chapter) {
        sermons[i].passage += '-' + sermons[i].passage_end.chapter + ':' + sermons[i].passage_end.verse
      } else if (sermons[i].passage_start.book_name !== sermons[i].passage_end.book_name) {
        sermons[i].passage += ';' + sermons[i].passage_end.book_name + ' ' + sermons[i].passage_end.chapter + ':' + sermons[i].passage_end.verse
      }
      sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
      //esv.getPassageHTML(sermon.passage, (passageText) => {
      //if (passageText) {
      //sermon.passageText = passageText.passages[0]
      //}
      // Need to call the ESV api and get the text for the passage and insert it into the sermon object.
      data.sermons.push(Object.assign({}, sermons[i]))
      if (i + 1 === sermons.length) {
        data.sermons.sort((a, b) => {
          return b.id - a.id
        })
        ejs.renderFile(path.join(__dirname, '../views/partials/sermon-list.ejs'), data, null, function (err, str) {
          if (err) throw new Error(err)
          let returnData = {
            results: true,
            html: str,
          }
          res.send(JSON.stringify(returnData))
          // str => Rendered HTML string
        })
      }
    } else {
      sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
      data.sermons.push(Object.assign({}, sermons[i]))
      if (i + 1 === sermons.length) {
        data.sermons.sort((a, b) => {
          return b.id - a.id
        })
        ejs.renderFile(path.join(__dirname, '../views/partials/sermon-list.ejs'), data, null, function (err, str) {
          if (err) throw new Error(err)
          let returnData = {
            results: true,
            html: str,
          }
          res.send(JSON.stringify(returnData))
          // str => Rendered HTML string
        })
      }
    }
  }
}

exports.getSermonsManage = async (req, res) => {
  let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
  if (isAdmin) {
    let data = {
      sermons: []
    }
    let number = (req.body.number) ? req.body.number : 10
    let sermons = await sermonsModel.getSermonsRange(number, req.body.startId).catch(e => { throw new Error(e) })
    data.sermons = sermons
    sermons.forEach(sermon => {
      sermon.date = date.formatDate(sermon.date, 'MM-DD-YYYY')
    })
    let lastId = sermons[sermons.length-1].id
    let firstId = sermons[0].id
    data.sermons.sort((a, b) => (a.id < b.id) ? 1 : -1)
    ejs.renderFile(path.join(__dirname, '../views/partials/sermons-manage.ejs'), data, null, function (err, str) {
      if (err) throw new Error(err)
      let returnData = {
        results: true,
        html: str,
        sermons : {
          lastId: lastId,
          firstId: firstId
        }
      }
      res.send(JSON.stringify(returnData))
    })
  } else {
    res.error({ error: true, message: 'Not Authorized'})
  }
}

exports.filterSermons = async (req, res) => {
  let filtering = req.body
  if (filtering.filter) {
    let results = await sermonsModel.filterSermons(filtering).catch(e => { throw new Error(e) })
    if (results.length > 0) {
      sendResponse(results, res)
    } else {
      res.send({ error: true, message: 'No Results Found' })
    }
  } else {
    res.send({ error: true, message: 'ERROR: Please include filtering parameters in your request.' })
  }
}

exports.clearFilterSermons = async (req, res) => {
  let data = {
    sermons: []
  }
  if (cache && cache.sermons && cache.sermons.length > 0) {
    data.sermons = cache.sermons
    data.speakers = cache.speakers
    data.series = cache.series
    ejs.renderFile(path.join(__dirname, '../views/partials/sermon-list.ejs'), data, null, function (err, str) {
      if (err) throw new Error(err)
      let returnData = {
        results: true,
        html: str,
      }
      res.send(JSON.stringify(returnData))
      // str => Rendered HTML string
    })
  } else {
    data.speakers = await sermonsModel.getAllSpeakers().catch(e => { throw new Error(e) })
    data.series = await sermonsModel.getAllSeries().catch(e => { throw new Error(e) })
    let sermons = sermonsModel.getXSermons(5).catch(e => { throw new Error(e) })
    for (var i = 0; i < sermons.length; i++) {
      sermons[i].speaker = sermons[i].first_name + ' ' + sermons[i].last_name
      // Eventually have this hard coded file be part of the settings table
      sermons[i].downloadFile = '/download-sermon/' + sermons[i].file
      sermons[i].file = '/sermons/' + sermons[i].file.replace(/ /g, '%20')
      if (sermons[i].passage_start_id) {
        let start_passage = await sermonsModel.getPassage(sermons[i].passage_start_id).catch(e => { throw new Error(e) })
        sermons[i].passage_start = {
          book_name: start_passage[0].book_name,
          chapter: start_passage[0].chapter,
          verse: start_passage[0].verse,
        }
        sermons[i].passage = start_passage[0].book_name + ' ' + start_passage[0].chapter + ':' + start_passage[0].verse
        let end_passage = await sermonsModel.getPassage(sermons[i].passage_end_id).catch(e => { throw new Error(e) })
        sermons[i].passage_end = {
          book_name: end_passage[0].book_name,
          chapter: end_passage[0].chapter,
          verse: end_passage[0].verse,
        }
        if (
          sermons[i].passage_start.book_name === sermons[i].passage_end.book_name &&
          sermons[i].passage_start.chapter === sermons[i].passage_end.chapter &&
          sermons[i].passage_start.verse !== sermons[i].passage_end.verse
        ) {
          sermons[i].passage += '-' + sermons[i].passage_end.verse
        } else if (
          sermons[i].passage_start.book_name === sermons[i].passage_end.book_name &&
          sermons[i].passage_start.chapter !== sermons[i].passage_end.chapter
        ) {
          sermons[i].passage += '-' + sermons[i].passage_end.chapter + ':' + sermons[i].passage_end.verse
        } else if (sermons[i].passage_start.book_name !== sermons[i].passage_end.book_name) {
          sermons[i].passage += ';' + sermons[i].passage_end.book_name + ' ' + sermons[i].passage_end.chapter + ':' + sermons[i].passage_end.verse
        }
        sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
        let passageText = esv.getPassageHTML(sermons[i].passage).catch(e => { throw new Error(e) })
        sermons[i].passageText = passageText.passages ? passageText.passages[0] : ''
          // Need to call the ESV api and get the text for the passage and insert it into the sermon object.
          data.sermons.push(Object.assign({}, sermons[i]))
          if (i + 1 === sermons.length) {
            data.sermons.sort((a, b) => {
              return b.id - a.id
            })
            ejs.renderFile(path.join(__dirname, '../views/partials/sermon-list.ejs'), data, null, function (err, str) {
              if (err) throw new Error(err)
              let returnData = {
                results: true,
                html: str,
              }
              res.send(JSON.stringify(returnData))
              // str => Rendered HTML string
            })
          }
      } else {
        sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
        data.sermons.push(Object.assign({}, sermons[i]))
        if (i + 1 === sermons.length) {
          data.sermons.sort((a, b) => {
            return b.id - a.id
          })
          ejs.renderFile(path.join(__dirname, '../views/partials/sermon-list.ejs'), data, null, function (err, str) {
            if (err) throw new Error(err)
            let returnData = {
              results: true,
              html: str,
            }
            res.send(JSON.stringify(returnData))
            // str => Rendered HTML string
          })
        }
      }
    }
  }
}

/**
 * get a specific sermon
 *
 */
exports.singleSermon = async (req, res) => {
  if (req.body.id !== undefined && req.body.id !== null) {
    let results = sermonsModel.getSingleSermon(req.body.id).catch(e => { throw new Error(e) })
    let response = {
      length: 0,
      results: [],
    }
    results.forEach((row) => {
      response.results.push(row)
    })
    response.length = results.length
    res.send(response)
  } else {
    res({ error: true, message: 'ERROR: Please include a sermon ID in your request.' })
  }
}

/**
 * services functionality - returns all of the services.
 */
exports.getAllServices = async (req, res) => {
  // Check user permissions
  if (req.body !== undefined && req.body !== null) {
    // Error handling
    let response = {
      length: 0,
      results: [],
    }
    let results = await sermonsModel.getAllServices().catch(e => { throw new Error(e) })
    if (results.length > 0) {
      results.forEach((row) => {
        response.results.push(row)
      })
      response.length = results.length
      res.send(response)
    } else {
      res.send(response)
    }
  } else {
    res.send({ error: true, message: 'Invalid Post Body' })
  }
}

/**
 * Series functionality - get all series
 */
exports.getAllSeries = async (req, res) => {
  // Check user permissions
  if (req.body !== undefined && req.body !== null) {
    let response = {
      length: 0,
      results: [],
    }
    let results = await sermonsModel.getAllSeries().catch(e => { throw new Error(e) })
    if (results.length > 0) {
      // is this even necessary?
      results.forEach((row) => {
        response.results.push(row)
      })
      response.length = results.length
      res.send(response)
    } else {
      res.send(response)
    }
  } else {
    res.send({ error: true, message: 'Invalid Post Body' })
  }
}

/**
 * Speaker functionality - get all the speakers
 */
exports.getAllSpeakers = async (req, res) => {
  // Check user permissions
  if (req.body !== undefined && req.body !== null) {
    let response = {
      length: 0,
      results: [],
    }
    let results = await sermonsModel.getAllSpeakers().catch(e => { throw new Error(e) })
    if (results.length > 0) {
      results.forEach((row) => {
        response.results.push(row)
      })
      response.length = results.length
      res.send(response)
    } else {
      res.send(response)
    }
  } else {
    res.send({ error: true, message: 'Invalid Post Body' })
  }
}

let addPassage = async (data, post, start, next) => {
  let passage = {}
  if (start) {
    if (data.sermonStartPassageBook && data.sermonStartPassageChapter && data.sermonStartPassageVerse) {
      passage = {
        book_id: data.sermonStartPassageBook,
        chapter: data.sermonStartPassageChapter,
        verse: data.sermonStartPassageVerse,
        start: true,
      }
    } else {
      data.passage_start_id = null
      next(data, post)
    }
  } else {
    if (data.sermonEndPassageBook && data.sermonEndPassageChapter && data.sermonEndPassageVerse) {
      passage = {
        book_id: data.sermonEndPassageBook,
        chapter: data.sermonEndPassageChapter,
        verse: data.sermonEndPassageVerse,
        start: false,
      }
    } else {
      data.passage_end_id = null
      next(data, post)
    }
  }
  let results = await sermonsModel.addPassage(passage).catch(e => { throw new Error(e) })
  if (results.insertId) {
    if (start) {
      post.passage_start_id = results.insertId
    } else {
      post.passage_end_id = results.insertId
    }
    next(data, post)
  } else {
    if (start) {
      post.passage_start_id = null
    } else {
      post.passage_end_id = null
    }
    next(data, post)
  }
}

let addSermonVideo = async (data, post, next) => {
  if (data.sermonVideo) {
    // insert the video url
    let url_id =
      data.sermonVideo.indexOf('?watch=') > -1
        ? data.sermonVideo.substring(data.sermonVideo.indexOf('?watch='), data.sermonVideo.length)
        : data.sermonVideo.substring(data.sermonVideo.lastIndexOf('/') + 1, data.sermonVideo.length)
    let embedded_url = 'https://www.youtube-nocookie.com/embed/' + url_id
    let videoInfo = await yt.getInfo(data.sermonVideo)
    let set = {
      url: data.sermonVideo,
      embedded_url: embedded_url,
      title: data.sermonTitle,
      tag: parseInt(data.sermonService),
    }
    // Handle if it is an unlisted video
    if (!videoInfo.error) {
      set.title = videoInfo.title
    }
    let results = await videoModel.addVideo(set).catch(e => { throw new Error(e) })
    if (results.insertId) {
      post.video_id = results.insertId
      next(data, post)
    } else {
      post.video_id = null
      next(data, post)
    }
  } else {
    post.video_id = null
    next(data, post)
  }
}

/**
 * add-sermon functionality
 * Needs login check
 */
exports.addSermon = (req, res) => {
  // Check user session to ensure that only logged in users with permissions can post things
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let data = req.body
      if (data) {
        let post = {}
        if (data && data.sermonSpeaker && data.sermonSeries && data.sermonService && data.sermonTitle && data.sermonDate && data.sermonFile) {
          // Build out the post object to place in the db.
          post.speaker_id = parseInt(data.sermonSpeaker)
          post.service_id = parseInt(data.sermonService)
          post.series_id = parseInt(data.sermonSeries)
          post.title = data.sermonTitle
          post.date = data.sermonDate
          post.file = data.sermonFile
          post.count = (data.count) ? data.count : 0
          post.duration = 0
          // Add in code to get the duration
          if (fs.existsSync(__dirname + '/../static/sermons/' + data.sermonFile)) {
            let duration = await mp3Duration(__dirname + '/../static/sermons/' + data.sermonFile).catch(e => { throw new Error(e) })
            if (duration) {
              post.duration = (duration / 60).toFixed(2)
            }
          }
          addPassage(data, post, true, (data, post) => {
            addPassage(data, post, false, (data, post) => {
              addSermonVideo(data, post, async (data, post) => {
                if (!data.id) {
                  let results = await sermonsModel.addSermon(post).catch(e => { throw new Error(e) })
                  if (results) {
                    res.send({ success: true, message: 'Added Sermon titled: ' + data.sermonTitle })
                  } else {
                    res.send({ error: true, message: 'Failed to add the Sermon' })
                  }
                  cache.buildCache()
                } else {
                  post.id = data.id
                  let results = sermonsModel.updateSermon(post).catch(e => { throw new Error(e) })
                  if (results) {
                    res.send({ success: true, message: 'Updated Sermon titled: ' + data.sermonTitle })
                  } else {
                    res.send({ error: true, message: 'Failed to add the Sermon' })
                  }
                  cache.buildCache()
                }
              })
            })
          })
        } else {
          res.send({ error: true, message: 'Invalid Post Body' })
        }
        // If there is a video url attached, insert that, then continue to insert the sermon using the returned id
      } else {
        res.send({ error: true, message: 'No Data' })
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
 * delete-sermon functionality
 * @param {*} req 
 * @param {*} res 
 */
exports.deleteSermon = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      if (req.body.id) {
        await sermonsModel.deleteSermon(req.body.id).catch(e => { throw new Error(e) })
        res.send({ success: true, message: 'Sermon Deleted.', id: req.body.id })
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    }
  })
}

/**
 * add-service functionality
 * Needs login check
 */
exports.addService = (req, res) => {
  // Check user permissions
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      if (req.body !== undefined && req.body !== null) {
        // Error handling
        let post = {
          name: req.body.name,
          time: req.body.time, // Prolly going to use moment here to identify if it is an actual time
        }
        let results = await sermonsModel.addService(post).catch(e => { throw new Error(e) })
        if (results) {
          res.send({ success: true })
        } else {
          res.send({ error: true, message: 'Failed to add Series.' })
        }
        cache.buildCache()
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
 * add-series functionality
 * Needs login check
 */
exports.addSeries = (req, res) => {
  // Check user permissions
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      if (req.body !== undefined && req.body !== null) {
        // Error Handling
        let post = {
          name: req.body.name,
        }
        let results = await sermonsModel.addSeries(post).catch(e => { throw new Error(e) })
        if (results) {
          res.send({ success: true })
        } else {
          res.send({ error: true, message: 'Failed to add Series.' })
        }
        cache.buildCache()
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    }
  })
}

/**
 * add-speaker functionality
 * Needs login check
 */
exports.addSpeaker = (req, res) => {
  // Check user permissions
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      if (req.body !== undefined && req.body !== null) {
        // first check if speaker already exists!

        let post = {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
        }
        let results = await sermonsModel.addSpeaker(post).catch(e => { throw new Error(e) })
        if (results) {
          res.send({ success: true, id: results.insertId })
        } else {
          res.send({ error: true, message: 'Failed to add Speaker' })
        }
        cache.buildCache()
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    }
  })
}

exports.incrementPlayCount = async (req, res) => {
  // First get the current sermon count
  let id = req.body.id
  let results = await sermonsModel.getSingleSermon(id).catch(e => { throw new Error(e) })
  let count = 1
  if (results[0].count) {
    count = ++results[0].count
  } 
  let updateResults = await sermonsModel.updateSermonCount(count, id).catch(e => { throw new Error(e) })
  if (updateResults.affectedRows === 1) {
    res.send({ success: true, message: 'Incremented Sermon Count'})
  } else {
    res.send({ error: true, message: 'Failed to Incremented Sermon Count'})
  }
}