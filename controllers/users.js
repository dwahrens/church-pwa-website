const email = require('../lib/email')
const secured = require('../lib/secured')
const encryption = require('../lib/encryption')
const users = require('../models/users')
const settings = require('../lib/appSettings').getSettings()

exports.approve = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let request = req.body
      let response = {}
      try {
        let results = await users.approveUser(request.uuid).catch(e => { throw new Error(e) })
        if (results.affectedRows > 0) {
          var subject = settings.appName + ' - Approved'
          var plainText = 'Hello, \r\n\r\nYou are now able to use '+ req.headers.host + '!\r\nWe look forward to seeing you online!'
          var html = 'Hello, <br /><br />You are now able to use <a href="https://' + req.headers.host +'">' + req.headers.host + '</a>! <br />We look forward to seeing you online!'
          var customId = 'UserApproved'
          email.sendMail(request.email.toString(), plainText, html, subject, customId)
          response.success = true
          response.message = 'Added User to Approved List'
          response.uuid = request.uuid
          res.send(JSON.stringify(response))
        } else {
          response.error = true
          response.message = 'Unable to find user.'
          res.send(JSON.stringify(response))
        }
      } catch (error) {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

exports.disapprove = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let request = req.body
      let response = {}
      try {
        let results = await users.disapproveUser(request.uuid).catch(e => { throw new Error(e) })
        if (results) {
          response.success = true
          response.message = 'Added User to Disapproved List'
          response.uuid = request.uuid
          res.send(JSON.stringify(response))
        }
      } catch (error) {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

exports.makeAdmin = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let request = req.body
      let response = {}
      try {
        let results = await users.makeAdmin(request.uuid).catch(e => { throw new Error(e) })
        if (results) {
          response.success = true
          response.message = 'Made User and Admin'
          response.uuid = request.uuid
          res.send(JSON.stringify(response))
        }
      } catch (error) {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

exports.removeAdmin = (req, res) => {
  secured.check(req, res, async (req, res) => {
    let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
    if (isAdmin) {
      let request = req.body
      let response = {}
      try {
        let results = await users.removeAdmin(request.uuid).catch(e => { throw new Error(e) })
          if (results) {
            response.success = true
            response.message = 'Removed User from Admin'
            response.uuid = request.uuid
            res.send(JSON.stringify(response))
          }
      } catch (error) {
        response.error = true
        response.message = error
        res.send(JSON.stringify(response))
      }
    } else {
      res.redirect('/public/livestream')
    }
  })
}

exports.checkUser = async (req, res, next) => {
  let result = {}
  // TO DO: include the uuid from the session 
  if (req.uuid) {
      let results = await users.findOne(req.uuid).catch(e => { throw new Error(e) })
      if (results.inserted) {
        let insertUser = await users.insertUser(req.user).catch(e => { throw new Error(e) })
        if (insertUser.insertId) {
          // New user, redirect to pending page. EJS
          // Send User object along to get their name.
          // Send an email notifying the group that an application has been filled out.
          var subject = settings.appName + ' - New Members Application'
          var plainText = 'Name: ' + req.user.displayName + '\r\nNickname: ' + req.user.nickname + '\r\nEmail: ' + req.user.emails[0].value
          var html = '<strong>Name: </strong>' + req.user.displayName + '<br /><strong>Nickname: </strong>' + req.user.nickname + '<br /><strong>Email: </strong>' + req.user.emails[0].value + '<br /><a href="https://' + req.headers.host + '/manage">Manage Users</a>'
          var customId = 'UserSignUp'
          var emails = settings.appRegistrationEmail
          email.sendMail(emails, plainText, html, subject, customId)
          let result = { view: 'pending', user: req.user }
          next(result, res)
        } else {
          next({ view: 'error', error: result }, res)
        }
      } else {
        // check if the users AuthId strategy changed and then update it.
        // Interrogate the is_approved field in results
        if (results[0].is_approved === 0 || results[0].is_approved === 2) {
          // Return pending page. EJS.
          // Pass User object to get their name.
          // Show sermons and live stream
          result.view = 'public'
        } else if (results[0].is_approved === 1) {
          // redirect to main page.
          result.view = 'authorized'
        }
        result.user = {
          'id': results[0].id,
          'first_name': encryption.decrypt(results[0].first_name),
          'last_name': encryption.decrypt(results[0].last_name),
          'phone': (results[0].phone) ? encryption.decrypt(results[0].phone) : '',
          'email': encryption.decrypt(results[0].email),
          'carrier': results[0].carrier_id,
          'text_alerts': results[0].text_alerts,
          'alerts': results[0].alerts,
          'is_admin': results[0].is_admin,
          'uuid': results[0].uuid
        }
        next(result, res)
      }
  } else {
    res.redirect('/public/livestream')
  }
}

exports.updateUser = (req, res) => {
  secured.check(req, res, async (req, res) => {
    var request = req.body
    // verification of other posted data
    if (request.phone.length !== 10) {
      var error = JSON.stringify({
        message: 'Phone number is invalid',
        error: true
      })
      res.send(error)
    } else {
      var data = {
        'phone': encryption.encrypt(request.phone.replace(/-/g, '')),
        'email': encryption.encrypt(request.email),
        'first_name': encryption.encrypt(request.first_name),
        'last_name': encryption.encrypt(request.last_name),
        'carrier_id': parseInt(request.carrier),
        'text_alerts': parseInt(request.text_alerts),
        'alerts': parseInt(request.alerts)
      }
      let results = await users.updateUser(data, request.uuid).catch(e => { throw new Error(e) })
      if (results.changedRows > 0) {
        res.send({ success: true, message: 'Updated Your Profile' })
      } else {
        res.send({ error: true, message: 'Failed to update Your Profile' })
      }
    }
  })
}

exports.resetPassword = (req, res) => {
  secured.check(req, res, (req, res) => {
    // First check that passwords match
    const { password, verifyPassword, uuid } = req.body
    let errors = [], success = []
    if(password !== verifyPassword) {
      errors.push({msg : 'Passwords do not match. Please ensure that the passwords are the same.'})
    }
    if(password.length < 8 ) {
      errors.push({msg : 'Please enter a password at least 8 characters including one number and one special character.'})
    }
    if(errors.length > 0 ) {
      res.send(JSON.stringify(errors))
    } else {
      encryption.hashPassword(password, async (pass) => {
        let results = await users.updatePassword(pass, uuid).catch(e => { throw new Error(e) })
        if (results.affectedRows > 0) {
          success.push({msg: 'Password reset!'})
          // send login page
          res.send(JSON.stringify(success))
        } else {
          errors.push({msg : 'There was an error updating your password! Please try again.'})
          res.send(JSON.stringify(errors))
        }
      })
    }
  })
}

exports.foodDonations = (req, res) => {
  let data = req.body
  if (data.honey.length === 0) {
    var anonymous = (data.anonymous) ? 'Yes' : 'No'
    var acceptText = (data.nomineeTexts) ? 'Yes' : 'No'
    var text = 'Hello, \r\n\r\nNew Submission to the Food Box Donations:\r\nName: ' + data.yourName
        text += '\r\nAnonymous: ' + anonymous
        text += '\r\nNominee Name: ' + data.nomineeName
        text += '\r\nNominee Phone: ' + data.nomineePhone
        text += '\r\nAccepts Texts: ' + acceptText
        text += '\r\nNominee Address: ' + data.nomineeAddress
        text += '\r\nNominee City: ' + data.nomineeCity
        text += '\r\nNominee Zip: ' + data.nomineeZip
        text += '\r\nNominee Email: ' + data.nomineeEmail
        text += '\r\nNumber of Adults: ' + data.nomineeAdults
        text += '\r\nNumber of Children: ' + data.nomineeChildren

    var html = 'Hello, <br /><br />New Submission to the Food Box Donations:<br />Name: ' + data.yourName
        html += '<br />Anonymous: ' + anonymous
        html += '<br />Nominee Name: ' + data.nomineeName
        html += '<br />Nominee Phone: ' + data.nomineePhone
        html += '<br />Accepts Texts: ' + acceptText
        html += '<br />Nominee Address: ' + data.nomineeAddress
        html += '<br />Nominee City: ' + data.nomineeCity
        html += '<br />Nominee Zip: ' + data.nomineeZip
        html += '<br />Nominee Email: ' + data.nomineeEmail
        html += '<br />Number of Adults: ' + data.nomineeAdults
        html += '<br />Number of Children: ' + data.nomineeChildren
    var emails = settings.appDonationEmail
    var subject = settings.appName + ' - Food Box Donation Submission'
    var customId = 'FoodDonation'
    email.sendMail(emails, text, html, subject, customId)
    res.send('Thank you for Nominating <span id="nomName"></span>')
  } else {
    res.send('There was an error in the submission. Please try again later.')
  }
}