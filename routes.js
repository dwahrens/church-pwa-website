/**
 * @api.js - manages all routing
 *
 * router.get when assigning to a single request
 * router.use when deferring to a controller
 *
 * @requires express
 */

const express = require('express')
const router = express.Router()
const path = require('path')
const rateLimit = require('express-rate-limit')
// Controllers
const index = require('./controllers/index')
const alert = require('./controllers/alerts')
const events = require('./controllers/events')
const manage = require('./controllers/manage')
const users = require('./controllers/users')
const message = require('./controllers/message')
const prayerRequests = require('./controllers/prayer')
const reading = require('./controllers/reading')
const registration = require('./controllers/registration')
const sermons = require('./controllers/sermons')
const videos = require('./controllers/videos')
const auth = require('./controllers/auth')
const pass = require('./controllers/pass')

const limitReached = (req, res) => {
  console.warn({ ip: req.ip }, 'Rate limiter triggered')
  res.status(429).sendFile(path.join(__dirname + '/static/429.html'))
 }
const options = {
  windowMs: 60000, // 1 minute
  max: 5,
  onLimitReached: limitReached, // called once when max is reached
  handler: limitReached, // called for each subsequent request once max is reached
}
const rateLimiter = rateLimit(options)

router.post('/send-food-donations', rateLimiter, users.foodDonations)
// Members Routes
router.get('/manage', rateLimiter, manage.manage)
router.post('/make-admin', rateLimiter, users.makeAdmin)
router.post('/remove-admin', rateLimiter, users.removeAdmin)
router.post('/approve-user', rateLimiter, users.approve)
router.post('/disapprove-user', rateLimiter, users.disapprove)
router.post('/update-member', rateLimiter, users.updateUser)
router.post('/reset-password', rateLimiter, users.resetPassword)
// Prayer Request Routes
router.post('/add-pr', rateLimiter, prayerRequests.addPrayerRequests)
router.post('/get-pr', rateLimiter, prayerRequests.getPublicPrayerRequests)
router.post('/update-pr', rateLimiter, prayerRequests.updatePrayerRequests)
router.post('/delete-pr', rateLimiter, prayerRequests.deletePrayerRequests)
router.post('/praying-for-request', prayerRequests.prayingForRequest)
router.get('/get-private-pr', rateLimiter, prayerRequests.getPrivatePr)
// Sermon Routes
router.post('/delete-sermon', rateLimiter, sermons.deleteSermon)
router.post('/get-sermons', sermons.getSermons)
router.post('/get-sermons-manage', sermons.getSermonsManage)
router.post('/sermon', rateLimiter, sermons.singleSermon)
router.post('/filter-sermons', sermons.filterSermons)
router.post('/clear-filter-sermons', sermons.clearFilterSermons)
router.post('/services', rateLimiter, sermons.getAllServices)
router.post('/series', rateLimiter, sermons.getAllSeries)
router.post('/speakers', rateLimiter, sermons.getAllSpeakers)
router.post('/add-sermon', rateLimiter, sermons.addSermon)
router.post('/add-service', rateLimiter, sermons.addService)
router.post('/add-series', rateLimiter, sermons.addSeries)
router.post('/add-speaker', rateLimiter, sermons.addSpeaker)
router.get('/sermons/:file', sermons.getSermonFiles)
router.get('/download-sermon/:file', sermons.downloadSermon)
router.post('/increment-sermon-count', sermons.incrementPlayCount)
// events Routes
router.post('/get-events', rateLimiter, events.getEvents)
router.post('/event', rateLimiter, events.getEvent)
router.post('/add-event', rateLimiter, events.addEvent)
router.post('/delete-event', rateLimiter, events.deleteEvent)
// Videos Routes
router.post('/add-video', rateLimiter, videos.addVideo)
router.post('/get-wed-prayer', rateLimiter, videos.getWednesdayEveningPrayer)
router.post('/get-daily-devos', videos.getDailyDevos)
router.post('/get-daily-devos-by-series', videos.getDailyDevosBySeries)
// Registration Routes
router.post('/schedule-registration', rateLimiter, registration.scheduleRegistration)
// Messages Route
router.post('/send-message', rateLimiter, message.sendMessage)
// Reading Routes
router.post('/add-author', rateLimiter, reading.addAuthor)
router.post('/add-reading', rateLimiter, reading.addReading)
// Alerts Routes
router.post('/notify-users', rateLimiter, alert.sendalerts)
router.post('/carriers', rateLimiter, alert.carriers)
router.post('/email-users', rateLimiter, alert.emailUsers)
// Login Routes
router.post('/login', rateLimiter, auth.login)
router.get('/login', (req, res) => {
  res.redirect('/public/login')
})
router.post('/register', rateLimiter, auth.signup)
router.get('/register', (req, res) => {
  res.redirect('/public/register')
})
router.get('/logout', rateLimiter, auth.logout)
router.get('/public/logout', rateLimiter, auth.logout)
// Password Reset form
router.get('/reset', rateLimiter, (req, res) => {
  res.redirect('/public/reset')
})
router.post('/sendReset', rateLimiter, pass.sendReset)
router.post('/reset/:token', rateLimiter, pass.reset)
router.get('/reset/:token', rateLimiter, pass.getReset)

router.get('/public', index.public)
router.get('/public/:page', index.public)
// prayer requests need to be merged into public.
router.get('/home', index.home)
router.get('/', (req, res) => {
  res.redirect('/public/livestream')
})

// Error handling
router.get('*', function(req, res){
  res.status(404).sendFile(path.join(__dirname + '/static/404.html'))
})

module.exports = router