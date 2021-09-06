const eventsModel = require('../models/events')
const cache = require('../lib/cache')
const secured = require('../lib/secured')
const usersModel = require('../models/users')

/**
 * get events, either a range or all events
 */
exports.getEvents = async (req, res) => {
  let response = {
    length: 0,
    results: []
  }
  if ((req.body.number !== undefined && req.body.number !== null && req.body.number !== 0)) {
    let number = req.body.number
    let results = eventsModel.getXEvents(number).catch(e => { throw new Error(e) })
    if (results) {
      sendResponse(results, response)
    } else {
      res.send({ error: true, message: 'Could not get the Events.' })
    }
  } else {
    let results = eventsModel.getAllEvents().catch(e => { throw new Error(e) })
    if (results) {
      sendResponse(results, response)
    } else {
      res.send({ error: true, message: 'Could not get the Events.' })
    }
  }

  function sendResponse(results, response) {
    var i = 0
    results.forEach(row => {
      response.results[i] = row
      i++
    })
    response.length = results.length
    res.send(response)
  }
}

/**
 * get a specific event
 * 
 */
exports.getEvent = async (req, res) => {
  let id = req.body.id
  if (id !== undefined && id !== null) {
    let response = {
      length: 0,
      results: []
    }
    let results = await eventsModel.getEvent(id).catch(e => { throw new Error(e) })
      if (results) {
        var i = 0
        results.forEach(row => {
          response.results[i] = row
          i++
        })
        response.length = results.length
        res.send(response)
      } else {
        res.send({ error: true, message: 'ERROR: Unable to lookup Event.' })
      }
  } else {
    res.send({ error: true, message: 'ERROR: Please include a Event ID in your request.' })
  }
}

/**
 * addEvent - dual purpose for adding an event and updating
 * @param {*} req 
 * @param {*} res 
 */
exports.addEvent = (req, res) => {
  // Check user session to ensure that only logged in users with permissions can post things
  secured.check(req, res, async (req, res) => {
    let isAdmin = usersModel.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
		if (isAdmin) {
      let data = req.body
      if (data && data.title && data.date && data.start_time && data.end_time) {
        if (data.id && data.id !== '') {
          let results = await eventsModel.updateEvent(data).catch(e => { throw new Error(e) })
          if (results.changedRows === 1) {
            res.send({ success: true, message: 'Successfully Updated Event ' + data.title + ' - ' + data.date, id: data.id, title: data.title, date: data.date, start_time: data.start_time, end_time: data.end_time, is_member_private: data.is_member_private })
          } else {
            res.send({ 'error': true, 'message': 'Failed to update Event' })
          }
          cache.buildCache()
        } else {
          let results = await eventsModel.addEvent(data).catch(e => { throw new Error(e) })
          if (results.insertId) {
            res.send({ success: true, message: 'Successfully Added Event', id: results.insertId })
          } else {
            res.send({ error: true, message: 'Failed to add Event' })
          }
          cache.buildCache()
        }
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

/**
 * delete-event functionality
 * Needs login check
 */
exports.deleteEvent = (req, res) => {
  // Check user permissions
  secured.check(req, res, async (req, res) => {
    let isAdmin = usersModel.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
		if (isAdmin) {
      if (req.body !== undefined && req.body !== null && req.body.id !== undefined && req.body.id !== null && req.body.id !== '') {
        let results = await eventsModel.deleteEvent(req.body.id).catch(e => { throw new Error(e) })
          if (results) {
            res.send({ success: true, id: req.body.id, message: 'Deleted Event.' })
            cache.buildCache()
          } else {
            res.send({ error: true, message: 'Failed to delete Event' })
          }
      } else {
        res.send({ error: true, message: 'Invalid Post Body' })
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}