const crypto = require('crypto')
const emailLib  = require ('../lib/email')
const encryption = require('../lib/encryption')
const pass = require('../models/pass')
const users = require('../models/users')
const settings = require('../lib/appSettings').getSettings()

exports.sendReset = async (req, res) => {
  // if no email is sent return an error to the user
  let errors = [], email = req.body.email
  if (email === '' || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    errors.push({ msg: 'Please enter a valid email.'})
  }
  if(errors.length > 0 ) {
    res.render('reset', { 
      page: 'reset',
      locals: {
        errors: errors,
        email: email,
      }
    })
  } else {
    res.render('reset', { 
      page: 'reset',
      locals: {
        success: true
      }
    })
    let hash = encryption.hash(email)
    let results = await users.findOne(hash, true).catch(e => { throw new Error(e) })
    if (results) {
      // create a hash and 2 days expiration date
      let token = crypto.randomBytes(20).toString('hex')
      let today = new Date()
      let tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // send email with hash to email submitted "This link will expire in 2 days"
      var subject = settings.appName + ' - Password Reset'
      var html = '<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>'
      html += '<p>Please click on the following link: <a href="https://' + req.headers.host + '/reset/' + token + '">Reset Password</a></p>'
      html += 'Or copy and paste this into your browser to complete the process: https://' + req.headers.host + '/reset/' + token + '</p>'
      html += '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>'
      var plainText = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.'
      plainText += '\r\nPlease click on the following link, or paste this into your browser to complete the process: '
      plainText += 'https://' + req.headers.host + '/reset/' + token
      plainText += '\r\nIf you did not request this, please ignore this email and your password will remain unchanged.'
      var customId = 'UserPasswordReset'
      
      emailLib.sendMail(email.toString(), plainText, html, subject, customId)
      // insert token, uuid, and expiration date
      await pass.insertPassReset({uuid: hash, token: token, expiration_date: tomorrow.toISOString().slice(0, 19).replace('T', ' ')})
    }
  }
}

exports.getReset = async (req, res) => {
  // get the password reset info from the req and db
  let token = req.params.token, errors = []
  let results = await pass.getPassReset(token)
  // Provide a form to enter a password and a verify password, hidden uuid input 
  if (results) {
    if (new Date(results[0].expiration_date) > Date.now()) {
      // send the password reset form
      res.render('password-reset', { 
        page: 'password-reset',
        locals: {
          uuid: results[0].uuid,
          token: results[0].token
        }
      })
    } else {
      // if the date is greater send an error "Reset link has expired, please request a new one"
      // send the reset form with an error stating that the date expired
      errors.push({msg: 'Password reset link expired. Please request a new one.'})
      res.render('reset', { 
        page: 'reset',
        locals: {
          errors: errors
        }
      })
    }
  } else {
    errors.push({msg: 'Password reset link expired. Please request a new one.'})
    res.render('reset', { 
      page: 'reset',
      locals: {
        errors: errors
      }
    })
  }
}

exports.reset = (req, res) => {
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
    res.render('password-reset', {
      page: 'password-reset',
      locals: {
        errors: errors
      }
    })
  } else {
    encryption.hashPassword(password, async (pass) => {
      let results = await users.updatePassword(pass, uuid).catch(e => { throw new Error(e) })
      if (results.affectedRows > 0) {
        success.push({msg: 'Password reset! Please login.'})
        // send login page
        res.render('login', { 
          page: 'login',
          locals: {
            success: success
          }
        })
      } else {
        errors.push({msg : 'There was an error updating your password! Please try again.'})
        res.render('password-reset', {
          page: 'password-reset',
          locals: {
            errors: errors
          }
        })
      }
    })
  }
  // Password strength
  // Set password using uuid
}