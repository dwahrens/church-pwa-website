/* eslint-disable no-unused-vars */
const db = require('./db')
const fs = require('fs')
const readline = require('readline')

var rl = readline.createInterface({
  input: fs.createReadStream('../database_structure.sql'),
  terminal: false
 })
rl.on('line', function(chunk){
  db.query(chunk.toString('ascii'), function(err, sets, fields){
    if(err) console.log(err)
  })
})
rl.on('close', function(){
  console.log("finished")
  db.end()
})