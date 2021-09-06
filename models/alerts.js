const encryption = require('../lib/encryption')
const db = require('../lib/db')

// change over to getMembers
exports.getNotificationSubscribers = (number, startingEvent) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM users WHERE alerts=1 AND is_approved=1 ORDER BY id'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [db.pool.escape(parseInt(number)), db.pool.escape(parseInt(startingEvent))])
      let unHashed = []
      rows.forEach(row => {
        unHashed.push({
          id: row.id,
          first_name: encryption.decrypt(row.first_name),
          last_name: encryption.decrypt(row.last_name),
          phone: (row.phone) ? encryption.decrypt(row.phone) : '',
          carrier: row.carrier_id,
          email: encryption.decrypt(row.email),
          text_alerts: row.text_alerts,
          is_approved: row.is_approved,
          alerts: row.alerts
        })
      })
      conn.release()
      resolve(unHashed)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getTextEmail = (carrierId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM carriers WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, db.pool.escape(parseInt(carrierId)))
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getCarriers = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, name, email FROM carriers ORDER BY name'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query)
        // if (error) throw new Error(error)
        var response = []
        rows.forEach((row) => {
          response.push({
            id: row.id,
            name: row.name,
            email: row.email
          })
        })
        conn.release()
        resolve(response)
      })
      .catch(err => {
        reject(err)
      })
  })
}