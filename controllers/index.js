/* eslint-disable no-undef */
const path = require('path')
const encryption = require('../lib/encryption')
const date = require('../lib/date')
const esv = require('../lib/esv')
const users = require('../models/users')
const eventsModel = require('../models/events')
const videoModel = require('../models/videos')
const alertsModel = require('../models/alerts')
const prayerModel = require('../models/prayer')
const sermonsModel = require('../models/sermons')
const { cache }  = require('../lib/cache')
const domain = require('../lib/appSettings').getSettings().domainName

exports.public = async (req, res) => {
  var todayDate = new Date()
  var data = {
    isIos: false,
    isMobile: false,
    usePng: false,
    page: req.params.page,
    authorized: false,
    loggedIn: false,
    todays_date: date.formatDate(todayDate, 'MM-DD-YYYY'),
    ten_days_date: date.formatDate(todayDate.setDate(todayDate.getDate() + 10), 'MM-DD-YYYY'),
    timeline: [],
    sermons: [],
    pr: [],
    video: {},
    boardCalendar: {
      title: 'Elder/Deacon Board Calendar',
      month: date.getCalendarMatrix(new Date()),
      events: [],
      modifyEvents: true
    },
    settings: {
      domain: domain
    }
  }
  if ((req.useragent.isiPad || req.useragent.isiPhone || req.useragent.isiPod) && req.useragent.isSafari) {
    data.isIos = true
  }
  data.isMobile = req.useragent.isMobile
  if (req.useragent.isSafari || req.useragent.isOpera) {
    data.usePng
  }
  if (req.isAuthenticated()) {
    let user = await users.findOne(req.user, true).catch(e => { throw new Error(e) })
    data.user = user
    data.loggedIn = true
    if (user.authorized) {
      // get livestream
      // get sermons
      // get daily devos
      data.authorized = true
      // Render private menu
      // renderPrivateView(res, data)
      if (cache.sundayschool) {
        data.sundayschool = cache.sundayschool
        renderView(res, data)
      } else {
        let sundayschool = await videoModel.getSundaySchool().catch(e => { throw new Error(e) })
        data.sundayschool = sundayschool[0]
        renderView(res, data)
      }
    } else {
      // Render public menu
      // There should be a better way to check on data page
      if (data.page === 'prayer-requests') {
        data.page = 'livestream'
      }
      if (cache.sundayschool) {
        data.sundayschool = cache.sundayschool
        renderView(res, data)
      } else {
        let sundayschool = await videoModel.getSundaySchool().catch(e => { throw new Error(e) })
        data.sundayschool = sundayschool[0]
        renderView(res, data)
      }
    }
  } else {
    data.user = false
    // Render public menu
    if (cache.sundayschool) {
      data.sundayschool = cache.sundayschool
      renderView(res, data)
    } else {
      let sundayschool = await videoModel.getSundaySchool().catch(e => { throw new Error(e) })
      data.sundayschool = sundayschool[0]
      renderView(res, data)
    }
  }
}

const renderView = async (res, data) => {
  switch (data.page) {
    case 'manifest.json':
      res.sendFile(path.join(__dirname + '/../static/manifest.json'))
      break
    case 'offline.html':
      res.sendFile(path.join(__dirname + '/../static/offline.html'))
      break
    case 'login_error.html':
      res.sendFile(path.join(__dirname + '/../static/login_error.html'))
      break
    case 'reset':
      res.render('reset', data)
      break
    case 'login':
      res.render('login', data)
      break
    case 'register':
      res.render('register', data)
      break
    case 'board':
      eventsModel.getAllEvents((events) => {
        // get the past three sermons
        var i = 0
        events.forEach((ev) => {
          data.boardCalendar.events[i] = {
            title: ev.title,
            date: date.formatDate(ev.date, 'MM-DD-YYYY'),
            start_time: date.formatTime(ev.start_time),
            end_time: date.formatTime(ev.end_time),
          }
          i++
        })
        res.render('board-area', data, { async: true })
      })
      break
    case 'livestream':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.livestream || cache.publicDesktop.livestream)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.livestream)
        } else {
          res.send(cache.publicDesktop.livestream)
        }
      } else if (cache && cache.video) {
        data.video = cache.video
        res.render('livestream', data)
      } else {
        let video = await videoModel.getLivestream().catch(e => { throw new Error(e) })
        data.video = video[0]
        res.render('livestream', data)
      }
      break
    case 'sermons':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.sermons || cache.publicDesktop.sermons)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.sermons)
        } else {
          res.send(cache.publicDesktop.sermons)
        }
      } else if (cache && cache.sermons && cache.sermons.length > 0) {
        data.sermons = cache.sermons
        data.speakers = cache.speakers
        data.series = cache.series
        res.render('sermons', data)
      } else {
        data.speakers = await sermonsModel.getAllSpeakers().catch(e => { throw new Error(e) })
        data.series = await sermonsModel.getAllSeries().catch(e => { throw new Error(e) })
        let sermons = await sermonsModel.getXSermons(5).catch(e => { throw new Error(e) })
        if (sermons.length > 0) {
          for (var i = 0; i < sermons.length; i++) {
            sermons[i].speaker = sermons[i].first_name + ' ' + sermons[i].last_name
            // Eventually have this hard coded file be part of the settings table
            sermons[i].downloadFile = '/download-sermon/' + sermons[i].file
            sermons[i].file = '/sermons/' + sermons[i].file.replace(/ /g, '%20')
            if (sermons[i].passage_start_id && sermons[i].passage_end_id) {
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
              let passageText = await esv.getPassageHTML(sermons[i].passage).catch(e => { throw new Error(e) })
              sermon.passageText = passageText.passages ? passageText.passages[0] : ''
              // Need to call the ESV api and get the text for the passage and insert it into the sermon object.
              data.sermons.push(Object.assign({}, sermons[i]))
              if (data.sermon.length === sermons.length) {
                data.sermons.sort((a, b) => {
                  return b.id - a.id
                })
                res.render('sermons', data)
              }
            } else {
              sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
              data.sermons.push(Object.assign({}, sermons[i]))
              if (sermon.data.length === sermons.length) {
                data.sermons.sort((a, b) => {
                  return b.id - a.id
                })
                res.render('sermons', data)
              }
            }
          }
        } else {
          res.render('sermons', data)
        }
      }
      break
    case 'daily-devos':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.dailyDevos || cache.publicDesktop.dailyDevos)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.dailyDevos)
        } else {
          res.send(cache.publicDesktop.dailyDevos)
        }
      } else if (cache && cache.dailyDevoTitles && cache.dailyDevos && cache.dailyDevos.length > 0 && cache.dailyDevoTitles.length > 0) {
        data.dailyDevos = cache.dailyDevos
        data.dailyDevoTitles = cache.dailyDevoTitles
        res.render('daily-devotions', data)
      } else {
        data.dailyDevos = await videoModel.getDailyDevotionalsBySeries(10, null, 2).catch(e => { throw new Error(e) })
        data.dailyDevoTitles = await videoModel.getAllDailyDevoTitles().catch(e => { throw new Error(e) })
        res.render('daily-devotions', data)
      }
      break
    case 'events':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.events || cache.publicDesktop.events)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.events)
        } else {
          res.send(cache.publicDesktop.events)
        }
      } else if (cache && cache.timeline && cache.timeline.length > 0) {
        data.timeline = cache.timeline
        res.render('events', data)
      } else {
        let events = await eventsModel.getXEvents(3, date.formatDate(Date.now(), 'YYYY-MM-DD'), true).catch(e => { throw new Error(e) })
          // get the past three sermons
        events.forEach((ev) => {
          data.timeline.push({
            title: ev.title,
            date: date.formatDate(ev.date, 'MM-DD-YYYY'),
            start_time: date.formatTime(ev.start_time),
            end_time: date.formatTime(ev.end_time),
          })
        })
        res.render('events', data)
      }
      break
    case 'food-donations':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.foodDonations || cache.publicDesktop.foodDonations)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.foodDonations)
        } else {
          res.send(cache.publicDesktop.foodDonations)
        }  
      } else {
        res.render('food-donations', data)
      }
      break
      case 'faq':
        if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.foodDonations || cache.publicDesktop.foodDonations)) {
          // public
          if (data.isMobile) {
            res.send(cache.publicMobile.faq)
          } else {
            res.send(cache.publicDesktop.faq)
          }
        } else {
          res.render('faq', data)
        }
        break
    case 'privacy-policy':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicMobile.privacyPolicy || cache.publicDesktop.privacyPolicy)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.privacyPolicy)
        } else {
          res.send(cache.publicDesktop.privacyPolicy)
        }
      } else {
        res.render('privacy-policy', data)
      }
      break
    case 'terms-conditions':
      if (cache && !data.authorized && !data.loggedIn && (cache.publicDesktop.termsConditions || cache.publicMobile.termsConditions)) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.termsConditions)
        } else {
          res.send(cache.publicDesktop.termsConditions)
        }
      } else {
        res.render('terms-conditions', data)
      }
      break
    case 'prayer-requests':
      if (data.authorized) {
        if (cache && cache.wedvideo && cache.pr && cache.pr.length > 0) {
          data.wedvideo = cache.wedvideo
          cache.pr.sort((a, b) => (a.id < b.id) ? 1 : -1)
          cache.pr.forEach((row) => {
            data.pr.push({
              id: row.id,
              uuid: row.uuid,
              name: encryption.decrypt(row.name),
              request: encryption.decrypt(row.request),
              date: row.date ? date.formatDate(row.date, 'MM/DD/YY') : '',
              interactions: row.interactions === false ? row.interactions : JSON.parse(encryption.decrypt(row.interactions))
            })
          })
          res.render('prayer-requests', data)
        } else {
          let video = await videoModel.getWednesdayEveningPrayer().catch(e => { throw new Error(e) })
          data.wedvideo = video[0]
          let prayerRequests = await prayerModel.getPublicPrayerRequests(true, 0, 8).catch(e => { throw new Error(e) })
          data.pr = []
          for (var n = 0; n < prayerRequests.length; n++) {
            let pri = await prayerModel.getPrayerRequestInteractions(prayerRequests[n].id).catch(e => { throw new Error(e) })
            if (pri && pri.length > 0) {
              let interactions = []
              for (const uuid in pri) {
                let user = await usersModel.getUserName(uuid).catch(e => { throw new Error(e) })
                if (user) {
                  interactions.push({ first_name: user.first_name, last_name: user.last_name, uuid: user.uuid })
                }
              }
              data.pr.push({
                id: prayerRequests[n].id,
                uuid: prayerRequests[n].uuid,
                name: encryption.decrypt(prayerRequests[n].first_name),
                request: encryption.decrypt(prayerRequests[n].request),
                date: prayerRequests[n].date ? date.formatDate(prayerRequests[n].date, 'MM/DD/YYYY') : '',
                interactions: interactions
              })
              if (prayerRequests.length === data.pr.length)
                res.render('prayer-requests', data)
            } else { 
              data.pr.push({
                id: prayerRequests[n].id,
                uuid: prayerRequests[n].uuid,
                name: encryption.decrypt(prayerRequests[n].first_name),
                request: encryption.decrypt(prayerRequests[n].request),
                date: prayerRequests[n].date ? date.formatDate(prayerRequests[n].date, 'MM/DD/YYYY') : '',
                interactions: false
              })
              if (prayerRequests.length === data.pr.length)
                res.render('prayer-requests', data)
            }
          }
        }
      } else {
        res.redirect('/public/livestream')
      }
      break
    case 'user-profile':
      if (cache && cache.carriers) {
        data.carriers = cache.carriers
        res.render('user-profile', data)
      } else {
        data.carriers = await alertsModel.getCarriers().catch(e => { throw new Error(e) })
        res.render('user-profile', data)
      }
      break
    case '1689':
      if (cache && !data.authorized && !data.loggedIn && cache.public.lbc) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.lbc)
        } else {
          res.send(cache.publicDesktop.lbc)
        }
      } else {
        res.render('1689lbc', data)
      }
      break
    default:
      if (cache && !data.authorized && !data.loggedIn && cache.public.livestream) {
        // public
        if (data.isMobile) {
          res.send(cache.publicMobile.livestream)
        } else {
          res.send(cache.publicDesktop.livestream)
        }
      } else if (cache && cache.video) {
        data.video = cache.video
        res.render('livestream', data)
      } else {
        let video = await videoModel.getLivestream().catch(e => { throw new Error(e) })
        data.video = video[0]
        res.render('livestream', data)
      }
      break
  }
}

exports.home = async (req, res) => {
  let usePng = false
  if (req.useragent.isSafari || req.useragent.isOpera) {
    usePng = true
  }
  let data = { png: usePng, timeline: [], sermons: [] }
  data.isMobile = req.useragent.isMobile
  var todayDate = new Date()
  data.todays_date = date.formatDate(todayDate, 'MM-DD-YYYY')
  data.ten_days_date = date.formatDate(todayDate.setDate(todayDate.getDate() + 10), 'MM-DD-YYYY')
  /* get the next three events from todays date */
  let currentDate = date.formatDate(Date.now(), 'YYYY-MM-DD')
  if (cache && cache.timeline && cache.timeline.length > 0 && cache.sermons && cache.sermons.length > 0) {
		data.timeline = cache.timeline
		// Only include the latest three sermons
		for(var n = 0; n < 2; n++) {
			data.sermons.push(cache.sermons[n])
		}
    res.render('home', data)
  } else {
    let events = await eventsModel.getXEvents(3, currentDate, true).catch(e => { throw new Error(e) })
      // get the past three sermons
      events.forEach((ev) => {
        data.timeline.push({
          title: ev.title,
          date: date.formatDate(ev.date, 'MM-DD-YYYY'),
          start_time: date.formatTime(ev.start_time),
          end_time: date.formatTime(ev.end_time),
        })
      })
      let sermons = sermonsModel.getXSermons(3).catch(e => { throw new Error(e) })
      if (sermons.length > 0) {
        for(var i = 0; i < sermons.length; i++) {
          sermons[i].speaker = sermons[i].first_name + ' ' + sermons[i].last_name
          // Eventually have this hard coded file be part of the settings table
          sermons[i].downloadFile = '/download-sermon/' + sermons[i].file
          sermons[i].file = '/sermons/' + sermons[i].file.replace(/ /g, '%20')
          if (sermons[i].passage_start_id) {
            let start_passage = await sermonsModel.getPassage(sermon.passage_start_id).catch(e => { throw new Error(e) })
            sermons[i].passage_start = {
              book_name: start_passage[0].book_name,
              chapter: start_passage[0].chapter,
              verse: start_passage[0].verse,
            }
            sermons[i].passage = start_passage[0].book_name + ' ' + start_passage[0].chapter + ':' + start_passage[0].verse
            let end_passage = await sermonsModel.getPassage(sermon.passage_end_id).catch(e => { throw new Error(e) })
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
            let passageText = await esv.getPassageHTML(sermon.passage).catch(e => { throw new Error(e) })
            sermons[i].passageText = passageText.passages ? passageText.passages[0] : ''
            // Need to call the ESV api and get the text for the passage and insert it into the sermon object.
            data.sermons.push(Object.assign({}, sermons[i]))
            if (data.sermons.length === sermons.length) {
              data.sermons.sort((a, b) => {
                return b.id - a.id
              })
              res.render('home', data)
            }
                
          } else {
            sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
            data.sermons.push(Object.assign({}, sermons[i]))
            if (data.sermons.length === sermons.length) {
              res.render('home', data)
            }
          }
        }
      } else {
        res.render('home', data)
      }
  }
}
