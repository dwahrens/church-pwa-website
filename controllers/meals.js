/**
 * Need to add logic for when a user submits to check if a date has already been taken
 */
const meal = require('../models/meal')
const secured = require('../lib/secured')

exports.addMealRequest = (req, res) => {
  secured.check(req, res, async (req, res) => {
    // Need to add a check to ensure that user can add meal request
    let post = req.body
    if (post.first_name && post.last_name && post.start_date && post.end_date) {
      let results = await meal.addMealRequest(post).catch(e => { throw new Error(e) })
      if (results.insertId > 0) {
        res.send({ success: true, msg: `Added Meal Request for ${post.first_name} ${post.last_name}`})
      } else {
        res.send({ error: true, msg: 'Failed to add meal request. Please try again later.' })
      }
    } else {
      res.send({ error: true, msg: 'Incorrect information added.' })
    }
  })
}