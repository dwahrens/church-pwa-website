/* eslint-disable no-unused-vars */
const db = require('../lib/db')

/**
 * All Prayer Requests - returns everything from the prayer_requests table
 */
exports.allPrayerRequests = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM prayer_requests'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.addPrayerRequest = (set) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO prayer_requests SET ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, set)
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.updatePrayerRequest = (set) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE prayer_requests SET request = ? WHERE id = ? AND uuid = ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, [set.request, set.id, set.uuid])
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.deletePrayerRequest = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM prayer_requests WHERE uuid = ? AND id = ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, [data.uuid, data.id])
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.getAllUnotifiedPrayerRequests = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM prayer_requests WHERE notification_sent = 0'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query)
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.completeNotificationPrayerRequests = (set, next) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE prayer_requests SET notification_sent = 1 WHERE id = ?'
    set.forEach(pr => {
      db.pool.getConnection()
        .then(async conn => {
          let [rows, fields] = await conn.query(query, [pr.id])
          conn.release()
          resolve(rows)
        })
        .catch(err => {
          reject(err)
        })
    })
    return true
  })
}

/**
* getPublicPrayerRequests: Helper function for both Websocket and Express endpoints
*/
exports.getPublicPrayerRequests = (latest, offsetPR, numPR) => {
  return new Promise((resolve, reject) => {
    var query = 'SELECT * FROM prayer_requests WHERE is_private = 0 '
    var limitPR = []
    if (!latest && (numPR !== null && numPR !== undefined) && numPR > 0 && (offsetPR !== null && offsetPR !== undefined)) {
      var starting = offsetPR - numPR
      if (starting < 0) {
        starting = 0
      }
      query += 'AND id BETWEEN ? AND ? ORDER BY id DESC'
      limitPR = [starting, offsetPR-1]
    } else if (latest && (numPR !== null && numPR !== undefined)) {
      query += 'ORDER BY id DESC LIMIT ?'
      limitPR = [numPR]
    }
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, limitPR)
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.addPrayerRequestInteraction = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO `prayer_request_interactions`(`prayer_request_id`, `uuid`) VALUES (?,?)'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, [data.id, data.uuid])
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.getPrayerRequestInteractions = (prayerId, next) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM prayer_request_interactions WHERE prayer_request_id = ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, [prayerId])
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.deletePrayerRequestInteractions = (prayerId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM prayer_request_interactions WHERE prayer_request_id = ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, [prayerId])
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}