const db = require('./db')

/* Start by looping through the rows...if the expire date is less than current time, Delete the Row */

exports.clean = () => {
  let currentTime = Math.round(Date.now() / 1000)
  let query = 'SELECT * FROM sessions'
  db.pool.query(query, (error, results) => {
    if (error) throw new Error(error)
    results.forEach((row) => {
      if (row.expires < currentTime) {
        let deleteQuery = 'DELETE FROM sessions WHERE session_id = ?'
        db.pool.query(deleteQuery, row.session_id, (error, results) => {
          if (error) throw new Error(error)
          // Session table cleaned.
          console.log(results)
        })
      }
    })
  })
  console.log('Cleaning Sessions Table.')
}