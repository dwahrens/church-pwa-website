const secured = require('../lib/secured')
const users = require('../models/users')
const registrationModel = require('../models/registration')

exports.scheduleRegistration = (req, res) => {
  secured.check(req, res, (req, res) => {
    users.checkIfAdmin(req.user, (isAdmin) => {
      if (isAdmin) {
        // Add checks for accurate Data
        let regDate = new Date(req.body.regDate)
        let day = ('0' + regDate.getDate()).slice(-2)
        let month = ('0' + (regDate.getMonth() + 1)).slice(-2)
        let year = regDate.getFullYear()
        let date = year + '-' + month + '-' + day
        let post = {
          'max_registrations': parseInt(req.body.regNum),
          'remaining_registrations': parseInt(req.body.regNum),
          'attendance_date': date,
          'type': parseInt(req.body.regType)
        }
        // Add data to sm_registration_max
        registrationModel.scheduleRegistration(post, (results) => {
          if (results.insertId) {
            res.send({ 'success': true, 'message': 'Added Registration' })
          }
        })
      } else {
        res.send({ 'error': true, 'message': 'Access Denied' })
      }
    })
  })
}