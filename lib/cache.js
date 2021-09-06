const date = require('./date')
const ejs = require('ejs')
const esv = require('./esv')
const path = require('path')
const encryption = require('../lib/encryption')
const videoModel = require('../models/videos')
const sermonsModel = require('../models/sermons')
const eventsModel = require('../models/events')
const prayerModel = require('../models/prayer')
const alertsModel = require('../models/alerts')
const usersModel = require('../models/users')
const views = path.join(__dirname, '../views/')
const domain = require('./appSettings').getSettings().domainName

var todayDate = new Date()
let cache = {
  isIos: false,
  usePng: false,
  png: true,
  authorized: false,
  loggedIn: false,
  user: false,
  todays_date: date.formatDate(todayDate, 'MM-DD-YYYY'),
  ten_days_date: date.formatDate(todayDate.setDate(todayDate.getDate() + 10), 'MM-DD-YYYY'),
  dailyDevos: [],
  dailyDevoTitles: [],
  series: [],
  speakers: [],
  timeline: [],
  sermons: [],
  sundayschool: {},
  video: {},
  publicDesktop: {},
  publicMobile: {},
  public: {},
  settings: {
    domain: domain
  }
}

let buildCache = async () => {
  console.log('Building Cache...')
  var todayDate = new Date()
  cache.todays_date = date.formatDate(todayDate, 'MM-DD-YYYY')
  cache.ten_days_date = date.formatDate(todayDate.setDate(todayDate.getDate() + 10), 'MM-DD-YYYY')
  // potentially cache EJS rendering
  cache.video = null
  let video = await videoModel.getLivestream().catch(e => { throw new Error(e) })
  cache.video = video[0]
  cache.speakers = null
  cache.dailyDevos = null
  let dailyDevos = await videoModel.getDailyDevotionalsBySeries(10, null, 2).catch(e => { throw new Error(e) })
  cache.dailyDevos = dailyDevos
  cache.dailyDevoTitles = null
  let dailyDevoTitles = await videoModel.getAllDailyDevoTitles().catch(e => { throw new Error(e) })
  cache.dailyDevoTitles = dailyDevoTitles.reverse()
  cache.timeline = null
  let events = await eventsModel.getXEvents(3, date.formatDate(Date.now(), 'YYYY-MM-DD'), true).catch(e => { throw new Error(e) })
  cache.timeline = []
  events.forEach((ev) => {
    cache.timeline.push({
      title: ev.title,
      date: date.formatDate(ev.date, 'MM-DD-YYYY'),
      start_time: date.formatTime(ev.start_time),
      end_time: date.formatTime(ev.end_time),
    })
  })
  cache.wedvideo = []
  let wedvideo = await videoModel.getWednesdayEveningPrayer().catch(e => { throw new Error(e) })
  cache.wedvideo = wedvideo[0]
  cache.pr = null
  let prayerRequests = await prayerModel.getPublicPrayerRequests(true, 0, 8).catch(e => { throw new Error(e) })
  cache.pr = []
  for (var prIndex = 0; prIndex < prayerRequests.length; prIndex++) {
    var pri = await prayerModel.getPrayerRequestInteractions(prayerRequests[prIndex].id)
    if (pri && pri.length > 0) {
      let prayerRequest = {
        id: prayerRequests[prIndex].id,
        uuid: prayerRequests[prIndex].uuid,
        name: prayerRequests[prIndex].first_name,
        request: prayerRequests[prIndex].request,
        date: prayerRequests[prIndex].date ? date.formatDate(prayerRequests[prIndex].date, 'MM/DD/YYYY') : '',
        interactions: null
      }
      let interactions = []
      for (var n = 0; n < pri.length; n++) {
      //pri.forEach((pr, i) => {
        let user = await usersModel.getUserName(pri[n].uuid)
        if (user) {
          interactions.push({ first_name: user.first_name, last_name: user.last_name, uuid: user.uuid })
        }
        if (pri.length === n + 1) {
          prayerRequest.interactions = encryption.encrypt(JSON.stringify(interactions))
          cache.pr.push(prayerRequest)
        }
      //})
      }
    } else { 
      cache.pr.push({
        id: prayerRequests[prIndex].id,
        uuid: prayerRequests[prIndex].uuid,
        name: prayerRequests[prIndex].first_name,
        request: prayerRequests[prIndex].request,
        date: prayerRequests[prIndex].date ? date.formatDate(prayerRequests[prIndex].date, 'MM/DD/YYYY') : '',
        interactions: false
      })
    }
  }
  cache.carriers = null
  let carriers = await alertsModel.getCarriers().catch(e => { throw new Error(e) })
  cache.carriers = carriers
  cache.sundayschool = null
  let sundayschool = await videoModel.getSundaySchool().catch(e => { throw new Error(e) })
  cache.sundayschool = sundayschool[0]
  let speakers = await sermonsModel.getAllSpeakers().catch(e => { throw new Error(e) })
  cache.speakers = speakers
  cache.series = null
  let series = await sermonsModel.getAllSeries().catch(e => { throw new Error(e) })
  cache.series = series
  cache.sermons = null
  let sermons = await sermonsModel.getXSermons(10).catch(e => { throw new Error(e) })
  cache.sermons = []
  for(var i = 0; i < sermons.length; i++) {
    sermons[i].speaker = sermons[i].first_name + ' ' + sermons[i].last_name
    // Eventually have this hard coded file be part of the settings table
    sermons[i].downloadFile = '/download-sermon/' + sermons[i].file
    if (sermons[i].file) {
      sermons[i].file = '/sermons/' + sermons[i].file.replace(/ /g, '%20')
    }
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
      let passageText = await esv.getPassageHTML(sermons[i].passage).catch(e => { throw new Error(e) })
      sermons[i].passageText = passageText.passages ? passageText.passages[0] : ''
      // Need to call the ESV api and get the text for the passage and insert it into the sermon object.
      cache.sermons.push(Object.assign({}, sermons[i]))
      if (i + 1 === sermons.length) {
        cache.sermons.sort((a, b) => {
          return b.id - a.id
        })
        buildCacheTemplates()
      }
    } else {
      sermons[i].date = date.formatDate(sermons[i].date, 'MM-DD-YYYY')
      cache.sermons.push(Object.assign({}, sermons[i]))
      if (i + 1 === sermons.length) {
        cache.sermons.sort((a, b) => {
          return b.id - a.id
        })
        buildCacheTemplates()
      }
    }
  }
}
/**
 * Callback hell b/c ejs is a pain in the neck to implement async
 */
let buildCacheTemplates = () => {
  cache.isMobile = true
  cache.page = 'livestream'
  ejs.renderFile(path.join(views, 'livestream.ejs'), cache, (err, str) => {
    if (err) throw new Error(err)
    cache.publicMobile.livestream = str
    cache.page = 'sermons'
    ejs.renderFile(path.join(views, 'sermons.ejs'), cache, (err, str) => {
      if (err) throw new Error(err)
      cache.publicMobile.sermons = str
      cache.page = 'daily-devos'
      ejs.renderFile(path.join(views, 'daily-devotions.ejs'), cache, (err, str) => {
        if (err) throw new Error(err)
        cache.publicMobile.dailyDevos = str
        cache.page = ''
        ejs.renderFile(path.join(views, 'events.ejs'), cache, (err, str) => {
          if (err) throw new Error(err)
          cache.publicMobile.events = str
          ejs.renderFile(path.join(views, 'food-donations.ejs'), cache, (err, str) => {
            if (err) throw new Error(err)
            cache.publicMobile.foodDonations = str
            ejs.renderFile(path.join(views, 'privacy-policy.ejs'), cache, (err, str) => {
              if (err) throw new Error(err)
              cache.publicMobile.privacyPolicy = str
              ejs.renderFile(path.join(views, 'terms-conditions.ejs'), cache, (err, str) => {
                if (err) throw new Error(err)
                cache.publicMobile.termsConditions = str
                ejs.renderFile(path.join(views, '1689lbc.ejs'), cache, (err, str) => {
                  if (err) throw new Error(err)
                  cache.publicMobile.lbc = str
                  ejs.renderFile(path.join(views, 'faq.ejs'), cache, (err, str) => {
                    if (err) throw new Error(err)
                    cache.publicMobile.faq = str
                    cache.page = 'home'
                    ejs.renderFile(path.join(views, 'home.ejs'), cache, (err, str) => {
                      if (err) throw new Error(err)
                      cache.public.home = str
                      cache.isMobile = false
                      cache.page = 'livestream'
                      ejs.renderFile(path.join(views, 'livestream.ejs'), cache, (err, str) => {
                        if (err) throw new Error(err)
                        cache.publicDesktop.livestream = str
                        cache.page = 'sermons'
                        ejs.renderFile(path.join(views, 'sermons.ejs'), cache, (err, str) => {
                          if (err) throw new Error(err)
                          cache.publicDesktop.sermons = str
                          cache.page = 'daily-devos'
                          ejs.renderFile(path.join(views, 'daily-devotions.ejs'), cache, (err, str) => {
                            if (err) throw new Error(err)
                            cache.publicDesktop.dailyDevos = str
                            cache.page = ''
                            ejs.renderFile(path.join(views, 'events.ejs'), cache, (err, str) => {
                              if (err) throw new Error(err)
                              cache.publicDesktop.events = str
                              ejs.renderFile(path.join(views, 'food-donations.ejs'), cache, (err, str) => {
                                if (err) throw new Error(err)
                                cache.publicDesktop.foodDonations = str
                                ejs.renderFile(path.join(views, 'privacy-policy.ejs'), cache, (err, str) => {
                                  if (err) throw new Error(err)
                                  cache.publicDesktop.privacyPolicy = str
                                  ejs.renderFile(path.join(views, 'terms-conditions.ejs'), cache, (err, str) => {
                                    if (err) throw new Error(err)
                                    cache.publicDesktop.termsConditions = str
                                    ejs.renderFile(path.join(views, '1689lbc.ejs'), cache, (err, str) => {
                                      if (err) throw new Error(err)
                                      cache.publicDesktop.lbc = str
                                      ejs.renderFile(path.join(views, 'faq.ejs'), cache, (err, str) => {
                                        if (err) throw new Error(err)
                                        cache.publicDesktop.faq = str
                                      })
                                    })
                                  })
                                })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

module.exports.cache = cache
module.exports.buildCache = buildCache
