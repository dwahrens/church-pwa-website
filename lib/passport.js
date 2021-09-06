const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const users = require('../models/users')
const encryption = require('../lib/encryption')

module.exports = (passport) => {
  passport.use('local', 
    new LocalStrategy({usernameField: 'email'}, async (email, password, done)=> {
      //match user
      let results = await users.findOne(encryption.hash(email), false).catch(e => { throw new Error(e) })
      if(!results) {
        return done(null, false, {msg: 'Cannot find that Email! Please <a href="/public/register">register</a>.'});
      } else {
        // Need to decrypt the user here
        // match pass
        bcrypt.compare(password, results.password, (err, isMatch)=>{
          if(err) throw new Error(err)

          if(isMatch) {
            return done(null, results)
          } else {
            return done(null, false, {msg : 'Incorrect Password. Please try again or <a href="/reset/password">reset password</a>.'})
          }
        })
      }
    })
  )
  passport.serializeUser((user, done) => {
    done(null, user.uuid)
  })
    
  passport.deserializeUser(async (uuid, done) => {
  let user = await users.findOne(uuid, true).catch(e => { throw new Error(e) })
    done(null, user)
  })
}