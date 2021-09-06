/* eslint-disable no-unused-vars */
const db = require('../lib/db')

exports.getEvents = (number, startingEvent) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT DISTINCT * FROM events WHERE id = ? LIMIT ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [db.pool.escape(parseInt(number)), db.pool.escape(parseInt(startingEvent))])
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getXEvents = (number, currDate, notPrivate) => {
  return new Promise((resolve, reject) => {
    let stmt =[]
    let query = 'SELECT DISTINCT title, date, TIME_FORMAT(`events`.`start_time`, \'%h:%i %p\') as start_time,'
    query += ' TIME_FORMAT(`events`.`end_time`, \'%h:%i %p\') as end_time FROM events'
    if (currDate && notPrivate) { 
      query += ' WHERE date >= ? AND is_member_private = ?'
      stmt.push(currDate)
      stmt.push(0)
      stmt.push(parseInt(number))
    } else if (currDate && !notPrivate) {
      query += ' WHERE date >= ?'
      stmt.push(currDate)
      stmt.push(parseInt(number))
    } else if (notPrivate) {
      query += ' WHERE is_member_private = ?'
      stmt.push(0)
      stmt.push(parseInt(number))
    } else {
      stmt.push(parseInt(number))
    }
    query += ' ORDER BY date ASC LIMIT ?'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query, stmt)
        // if (error) throw new Error(error)
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.getAllEvents = () => {
  return new Promise((resolve, reject) => {
    // return all of the sermons in the db.
    let query = 'SELECT * FROM events WHERE date >= CURDATE()'
    return db.pool.getConnection()
      .then(async conn => {
        let [rows, fields] = await conn.query(query)
        // if (error) throw new Error(error)
        conn.release()
        resolve(rows)
      })
      .catch(err => {
        reject(err)
      })
  })
}

exports.getEvent = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM events WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [parseInt(id)])
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.addEvent = (set) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO events SET ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, set)
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.deleteEvent = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'DELETE FROM events WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [parseInt(id)])
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.updateEvent = (set) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE events SET title = ?, date = ?, start_time = ?, end_time = ?, is_member_private = ? WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [set.title, set.date, set.start_time, set.end_time, set.is_member_private, set.id])
      // if (error) throw new Error(error)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}