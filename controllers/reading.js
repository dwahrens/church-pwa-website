const cache = require('../lib/cache')
const secured = require('../lib/secured')
const users = require('../models/users')
const readingModel = require('../models/reading')

exports.addAuthor = (req, res) => {
  secured.check(req, res, async(req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let data = req.body
      if (data && data.first_name && data.last_name) {
        let results = await readingModel.addAuthor(data).catch(e => { throw new Error(e) })
        if (results.insertId) {
          res.send({ success: true, message: 'Successfully Added Author', id: results.insertId })
        } else {
          res.send({ error: true, message: 'Failed to add Author' })
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

exports.addReading = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let data = req.body
      if (data && data.authors_id && data.title && data.link) {
        let results = await readingModel.addReading(data).catch(e => { throw new Error(e) })
        if (results.insertId) {
          res.send({ success: true, message: 'Successfully Added Book', id: results.insertId })
        } else {
          res.send({ error: true, message: 'Failed to add Book' })
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