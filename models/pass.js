/* eslint-disable no-unused-vars */
const db = require('../lib/db')

// uuid, token, expiration_date
exports.insertPassReset = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO `pass_reset` SET ?'
		return db.pool.getConnection()
		.then(async conn => {
			let [rows, fields] = await conn.query(query, [data])
			conn.release()
			resolve(rows)
		})
		.catch(err => {
			reject(err)
		})
	})
}

exports.getPassReset = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM `pass_reset` WHERE token = ?'
		return db.pool.getConnection()
		.then(async conn => {
			let [rows, fields] = await conn.query(query, [data])
			conn.release()
      if (rows.length > 0) {
        resolve(rows)
      } else {
        resolve(false)
      }
		})
		.catch(err => {
			reject(err)
		})
	})
}