const passport = require('passport')
const encryption = require('../lib/encryption')
const users = require('../models/users')
const emailLib = require('../lib/email')
const settings = require('../lib/appSettings').getSettings()

exports.signup = async (req, res) => {
  const {firstName, lastName, email, phone, password, verifyPassword, notifications, c} = req.body
  let errors = []
  if(!firstName || !lastName || !email || !password || !verifyPassword) {
    errors.push({msg : 'Please fill in all fields'})
  }
  if(password !== verifyPassword) {
    errors.push({msg: 'Passwords do not match. Please ensure that the passwords are the same.'})
  }
  if (firstName === lastName) {
    errors.push({ msg: 'Bad post information.' })
  }
  if(password.length < 8 ) {
    errors.push({msg: 'Please enter a password at least 8 characters including one number and one special character.'})
  }
  if (!(c.indexOf('1689') > -1)) {
    errors.push({ msg: 'Wrong answer to the security question! Please try again.' })
  }
  if(errors.length > 0 ) {
    res.render('register', { 
      page: 'register',
      locals: {
        errors : errors,
        firstName : firstName,
        lastName : lastName,
        phone: phone,
        email : email,
        password : password,
        verifyPassword : verifyPassword
      }
    })
  } else {
    //validation passed
    let hash = encryption.hash(email)
    let user = await users.findOne(hash, false).catch(e => { throw new Error(e) })
    if(user && user.id > 0) {
      errors.push({msg: 'Email already registered! Please try another one or <a href="/public/login">login</a>.'})
      res.render('register', { 
        page: 'register',
        locals: {
          errors : errors,
          firstName : firstName,
          lastName : lastName,
          phone: phone,
          email : email,
          password : password,
          verifyPassword : verifyPassword
        }
      })
    } else {
      let user = {
        password: null,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        is_approved: 0,
        notifications: notifications ? 1 : 0,
        uuid: hash
      }
      encryption.hashPassword(password, async (pass) => {
        user.password = pass
        let results = await users.insertUser(user)
        if (results.insertId) {
          // New user, redirect to pending page. EJS
          // Send User object along to get their name.
          // Send an email notifying the group that an application has been filled out.
          var subject = settings.appName + ' - New Members Application'
          var plainText = 'Name: ' + firstName + ' ' + lastName + '\r\nEmail: ' + email
          var html = '<strong>Name: </strong>' + firstName + ' ' + lastName + '<br /><strong>Email: </strong>' + email
          var customId = 'UserSignUp'
          var emails = settings.appRegistrationEmail
          emailLib.sendMail(emails, plainText, html, subject, customId)
          req.logIn(user, function(err) {
            if (err) throw new Error(err)
            return res.redirect('/public/livestream')
          })
        } else {
          errors.push({msg: 'Failed to register, please send an email to <a href="mailto:' + settings.appSupportEmail + '">' + settings.appSupportEmail + '</a>'})
          res.render('register', { 
            page: 'register',
            locals: {
              errors : errors,
              firstName : firstName,
              lastName : lastName,
              phone: phone,
              email : email,
              password : password,
              verifyPassword : verifyPassword
            }
          })
        }
      })        
    }
  }
}

exports.login = (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) throw new Error(error)
    let errors = []
    if (!user) {
      res.render('login', { 
        page: 'login',
        locals: {
          errors: errors,
          email: req.body.email
        }
      })
    } else {
      req.logIn(user, function(err) {
        if (err) { return next(err) }
        return res.redirect('/public/livestream')
      })
    }
  }) (req, res, next)
}

exports.logout = (req, res) => {
  console.log('Destroying Session: ' + JSON.stringify(req.session))
  req.logout()
  req.session.destroy(function (err) {
    if (err) throw new Error(err)
    res.redirect('/public/livestream')
  })
}