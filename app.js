/* eslint-disable no-undef */
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const mySQLStore = require('express-mysql-session')(session)
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const passport = require('passport')
require('./lib/passport')(passport)
const useragent = require('express-useragent')
const multer = require('multer')
const upload = multer()
const cron = require('node-cron')
const { join } = require('path')
const db = require('./lib/db')
const routes = require('./routes')
//const authRoute = require('./routes/auth')
const cache = require('./lib/cache')
const monitor = require('./lib/monitor')
const settings = require('./lib/appSettings').getSettings()

//const socketApi = require('./lib/socketApi').socketApi
const sessionStore = new mySQLStore(db.options)

const port = settings.port
const sessionConfig = {
	secret: settings.appSessionSecret,
	cookie: { maxAge: 24 * 30 * 60 * 60 * 1000, sameSite: true, secure: true, httpOnly: true },
	proxy: true,
	store: sessionStore,
	resave: false,
	saveUninitialized: false,
	rolling: true
}

const app = express()

if (app.get('env') === 'production') {
	app.set('trust proxy', 1)
	sessionConfig.cookie.secure = true
	sessionConfig.proxy = true
}
app.use(session(sessionConfig))
app.use(helmet())
app.use(cookieParser(settings.appSessionSecret))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(upload.array())
app.use(useragent.express())
app.use(passport.initialize())
app.use(passport.session())


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('view options', { layout: false } )

app.use('/static', express.static(join(__dirname, 'static')))
app.use('/public', express.static(join(__dirname, 'static')))

app.use('/', routes)

app.get('/favicon.ico', (req, res) => { res.send('/static/icons/img/favicon.ico') })

cache.buildCache()

cron.schedule('0 0 4 * * *', () => {
	cache.buildCache()
})
var valid = cron.validate('0 0 */2 * * *')
console.log('Starting Prayer Request Cron: ' + valid)
cron.schedule('0 0 */2 * * *', () => {
	monitor.sendPrayerRequestsNotification()
})
var server = app.listen(port, () => console.log(`Church app listening on port ${port}.`))
var socketApi = require('./lib/socketApi')
var io = socketApi.io
io.attach(server)