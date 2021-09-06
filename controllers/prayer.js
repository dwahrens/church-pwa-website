const email  = require ('../lib/email')
const cache = require('../lib/cache')
const date = require('../lib/date')
const encryption = require('../lib/encryption')
const socketApi = require('../lib/socketApi')
const ejs = require('ejs')
const path = require('path')
const secured = require('../lib/secured')
const prayerModel = require('../models/prayer')
const prPartial = path.join(__dirname, '../views/partials/')
const users = require('../models/users')
const settings = require('../lib/appSettings').getSettings()


/**
 * get-private-pr: Retrieve the private Prayer Requests or basically everything in the prayer requests table.
 */
exports.getPrivatePr = function (req, res) {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let response = {}
      let results = await prayerModel.allPrayerRequests().catch(error => {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      })
      if (results.length <= 0) {
        response.no_requests = true
        response.message = 'No Prayer Requests found in this database.'
      } else {
        response.results = []
        let i = 0
        results.forEach(row => {
          response.results[i] = {}
          response.results[i].id = row.id
          response.results[i].first_name = encryption.decrypt(row.first_name)
          response.results[i].last_name = encryption.decrypt(row.last_name)
          response.results[i].request = encryption.decrypt(row.request)
        })
      }
      res.send(JSON.stringify(response))
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
 * add-pr: Add a Prayer Request. Public or Private.
 */
exports.addPrayerRequests = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAuth = await users.checkIfAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let rqt = req.body, response = {}, is_private, notification_sent
      if (rqt.uuid.length > 0 && rqt.fname.length > 0 && rqt.lname.length > 0 && rqt.pr.length > 0 && rqt.pr.length < 500) {
        if (rqt.is_private === null) {
          is_private = 0
          notification_sent = 0
        } else {
          is_private = rqt.is_private
          notification_sent = rqt.is_private
        }
        let set = {
          uuid: rqt.uuid,
          first_name: encryption.encrypt(rqt.fname),
          last_name: encryption.encrypt(rqt.lname),
          request: encryption.encrypt(rqt.pr),
          is_private: is_private,
          date: date.formatDate(new Date(Date.now()), 'YYYY-MM-DD'),
          notification_sent: notification_sent
        }
        let results = await prayerModel.addPrayerRequest(set).catch(e => { 
          response.error = true
          response.message = e.message
          res.send(JSON.stringify(response))  
          throw new Error(e) 
        })
        if (results.insertId) {
          response.message = 'Successfully added Prayer Request.'
          // Send the newly created prayer request back to the websocket clients
          if (!is_private) {
            /*response.results = [{
              id: results.insertId,
              'name': rqt.fname,
              request: rqt.pr,
              'date': formattedDate
            }]
            response.newPrayerRequest = true
            socketApi.sendLatestPrayerRequest(response)*/
            socketApi.sendLatestPrayerRequest({ uuid: rqt.uuid })
            /*response.message = 'Successfully added Prayer Request.'
            res.send(JSON.stringify(response))*/
          } else {
            var text = 'Name: ' + rqt.fname + ' ' + rqt.lname + '\r\nPrayer Request: ' + rqt.pr
            var html = 'Name: ' + rqt.fname + ' ' + rqt.lname + '<br/>Prayer Request: ' + rqt.pr
            var subject = settings.appName + ' - Private Prayer Request'
            var customId = 'PrivatePrayerRequest'
            var emails = settings.appPrayerEmail
            email.sendMail(emails, text, html, subject, customId)
            response.message = 'Successfully added Prayer Request.'
          }
          res.send(JSON.stringify(response))
          cache.buildCache()
        } else {
          response.error = true
          response.message = 'Failed to add a prayer request, please try again later!'
          res.send(JSON.stringify(response))
        }
      } else {
        response.error = true
        response.message = 'Please add your first name, last name and prayer request.'
        res.send(JSON.stringify(response))
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
 * delete-pr: Deletes the specific prayer request with the prayer id and user uuid
 * @param {*} req 
 * @param {*} res 
 */
exports.deletePrayerRequests = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAuth = await users.checkIfAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let results = await prayerModel.deletePrayerRequest(req.body).catch(e => { throw new Error(e) })
        if (results) {
          let deleteResults = await prayerModel.deletePrayerRequestInteractions(req.body.id).catch(e => { throw new Error(e) })
          if (deleteResults) {
            socketApi.sendLatestPrayerRequest({ uuid: req.body.uuid })               
            res.send({ success: true, message: 'Successfully deleted your prayer request.' })
            cache.buildCache()
          }
        }
    } else {
      res.send({ error: true, message: 'You are not approved to perform that action.' })
    }
  })
}
/**
 * update-pr: Updates the specific prayer request
 */
exports.updatePrayerRequests = function (req, res) {
  secured.check(req, res, async (req, res) => {
    let isAuth = await users.checkIfAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let rqt = req.body, response = {}
        if (rqt.id > 0 && rqt.request.length < 500) {
          let set = {
            id: rqt.id,
            request: encryption.encrypt(rqt.request),
            uuid: rqt.uuid
          }
          let results = await prayerModel.updatePrayerRequest(set).catch(e => { throw new Error(e) })
          if (results.affectedRows > 0) {
            socketApi.sendLatestPrayerRequest({ uuid: rqt.uuid})
            response.success = true
            response.message = 'Successfully Updated Prayer Request'
            res.send(JSON.stringify(response))
            cache.buildCache()
          } else {
            response.error = true
            response.message = 'Failed to update prayer request, please try again later!'
            res.send(JSON.stringify(response))
          }
        } else {
          response.error = true
          response.message = 'Please shorten your prayer request.'
          res.send(JSON.stringify(response))
        }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
* get-pr: Retrieve the Prayer Requests
*/
exports.getPublicPrayerRequests = function (req, res) {
  secured.check(req, res, async (req, res) => {
    let isAuth = await users.checkIfAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      let response = {}
      try {
        let response = {}
        //message.latest, message.startingRequest, message.numberOfRequests
        let prayerRequests = await prayerModel.getPublicPrayerRequests(true, 0, 8).catch(e => { throw new Error(e) })
        // get the partial text from the prayer-requests.ejs file
        let data = {
          pr: [],
          user: req.user
        }
        for (var i = 0; i < prayerRequests.length; i++) {
          let pri = await prayerModel.getPrayerRequestInteractions(prayerRequests[i].id).catch(e => { throw new Error(e) })
          if (pri && pri.length > 0) {
            let interactions = []
            for (const uuid in pri) {
              let user = await users.getUserName(uuid).catch(e => { throw new Error(e) })
              if (user) {
                interactions.push({ first_name: user.first_name, last_name: user.last_name })
              }
            }
            data.pr.push({
              id: prayerRequests[i].id,
              uuid: prayerRequests[i].uuid,
              name: encryption.decrypt(prayerRequests[i].first_name),
              request: encryption.decrypt(prayerRequests[i].request),
              date: prayerRequests[i].date ? date.formatDate(prayerRequests[i].date, 'MM/DD/YYYY') : '',
              interactions: interactions
            })
            if (data.pr.length === prayerRequests.length) {
              ejs.renderFile(path.join(prPartial, 'prayer-requests-list.ejs'), data, (err, str) => {
                if (err) throw new Error(err)
                response.newPrayerRequest = true
                response.html = str.replace('/\r?\n|\r/', '')
                // send the response through the socket
                res.send(response)
              })
            }
          } else { 
            data.pr.push({
              id: prayerRequests[i].id,
              uuid: prayerRequests[i].uuid,
              name: encryption.decrypt(prayerRequests[i].first_name),
              request: encryption.decrypt(prayerRequests[i].request),
              date: prayerRequests[i].date ? date.formatDate(prayerRequests[i].date, 'MM/DD/YYYY') : '',
              interactions: false
            })
            if (data.pr.length === prayerRequests.length) {
              ejs.renderFile(path.join(prPartial, 'prayer-requests-list.ejs'), data, (err, str) => {
                if (err) throw new Error(err)
                response.newPrayerRequest = true
                response.html = str.replace('/\r?\n|\r/', '')
                // send the response through the socket
                res.send(response)
              })
            }
          }
        }
      } catch (error) {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      }
    }
  })
}

exports.prayingForRequest = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAuth = await users.checkIfAuth(req.user).catch(e => { throw new Error(e) })
    if (isAuth) {
      // Need to run an update query with the uuid and prayer request id on the table prayer_request_interactions
      let result = await prayerModel.addPrayerRequestInteraction(req.body).catch(e => { throw new Error(e) })
      if (result.insertId > 0) {
        // get the prayer requests again and replace the html on the page
        let pri = await prayerModel.getPrayerRequestInteractions(req.body.id).catch(e => { throw new Error(e) })
        if (pri && pri.length > 0) {
          let response = {
            success: true,
            interactions: []
          }
          for (const uuid in pri) {
            let results = await users.getUserName(uuid).catch(e => { throw new Error(e) })
            if (results) {
              response.interactions.push({ first_name: results.first_name, last_name: results.last_name })
            }
          }
          res.send(response)
          cache.buildCache()
        } else {
          res.send({ no_results: true, message: 'No Interactions' })
        }
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}