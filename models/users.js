/* eslint-disable no-unused-vars */
const encryption = require('../lib/encryption')
const db = require('../lib/db')

// Move to Model
exports.insertUser = (user) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO users SET ?'
		var post = {
			'first_name': encryption.encrypt(user.first_name),
			'last_name': encryption.encrypt(user.last_name),
			'phone': (user.phone) ? encryption.encrypt(user.phone) : null,
			'carrier_id': null,
			'email': encryption.encrypt(user.email),
			'password': user.password,
			'text_alerts': 0,
			'is_admin': 0,
			'is_approved': 0,
			'alerts': user.notifications,
			'uuid': user.uuid
		}
		return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, post)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
	})
}

// Move to Model - split into controller
// Probably Unnecessary
exports.checkUser = (user) => {
	return new Promise((resolve, reject) => {
		// needs to be email but email is encrypted...
		const query = 'SELECT * FROM users'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [user.uuid])
				let unHashed = {
					inserted: false
				}
				rows.forEach(row => {
					if (user.email.value == encryption.decrypt(row.email)) {
						unHashed.inserted = true
						unHashed.id = row.id
						unHashed.first_name = encryption.decrypt(row.first_name)
						unHashed.last_name = encryption.decrypt(row.last_name)
						unHashed.phone = (row.phone) ? encryption.decrypt(row.phone) : ''
						unHashed.carrier = row.carrier_id,
						unHashed.email = encryption.decrypt(row.email)
						unHashed.text_alerts = row.text_alerts
						unHashed.is_admin = row.is_admin
						unHashed.is_approved = row.is_approved
						unHashed.alerts = row.alerts
						unHashed.uuid = row.uuid
					}
				})
				conn.release()
				resolve(unHashed)
			})
			.catch(err => {
				reject(err)
			})
	})
}

// Move to Lib
exports.checkIfAdmin = (user) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT is_admin FROM users WHERE uuid = ?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [user.uuid])
				var is_admin = (rows.length > 0 && rows[0].is_admin === 1) ? true : false
				conn.release()
				resolve(is_admin)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.checkIfAuth = (user) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT is_approved FROM users WHERE uuid = ?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [user.uuid])
				var is_auth = (rows.length > 0 && rows[0].is_approved === 1) ? true : false
				conn.release()
				resolve(is_auth)
			})
			.catch(err => {
				reject(err)
			})
	})
}

// Move to Lib
exports.getAllUsers = () => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query)
				let unHashed = []
				rows.forEach(row => {
					unHashed.push({
						inserted: true,
						id: row.id,
						first_name: encryption.decrypt(row.first_name),
						last_name: encryption.decrypt(row.last_name),
						phone: (row.phone) ? encryption.decrypt(row.phone) : '',
						carrier: row.carrier_id,
						email: encryption.decrypt(row.email),
						text_alerts: row.text_alerts,
						is_admin: row.is_admin,
						is_approved: row.is_approved,
						alerts: row.alerts,
						uuid: row.uuid
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

exports.getUserName = (uuid) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT first_name, last_name, uuid FROM users WHERE uuid=?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [uuid])
				conn.release()
				if (rows && rows.length > 0) {
					resolve({ first_name: encryption.decrypt(rows[0].first_name), last_name: encryption.decrypt(rows[0].last_name), uuid: rows[0].uuid })
				} else { 
					resolve(false)
				}
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.makeAdmin = (id) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET is_admin=1 WHERE uuid=?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [id])
				conn.release()
				resolve(rows)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.removeAdmin = (id) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET is_admin=0 WHERE uuid=?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [id])
				conn.release()
				resolve(rows)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.approveUser = (id) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET is_approved=1 WHERE uuid=?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [id])
				conn.release()
				resolve(rows)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.disapproveUser = (id) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET is_approved=2 WHERE uuid=?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [id])
				conn.release()
				resolve(rows)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.updateUser = (post, id) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET ? WHERE uuid = ?'
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [post, id])
				conn.release()
				resolve(rows)
			})
			.catch(err => {
				reject(err)
			})
	})
}

exports.updatePassword = (password, uuid) => {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE users SET password = ? WHERE uuid = ?'
		return db.pool.getConnection()
		.then(async conn => {
			let [rows, fields] = await conn.query(query, [password, uuid])
			conn.release()
			resolve(rows)
		})
		.catch(err => {
			reject(err)
		})
	})
}

exports.findOne = (hash, deserialize) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT * FROM users WHERE uuid = ?'
		let uuid = hash.uuid ? hash.uuid : hash
		return db.pool.getConnection()
			.then(async conn => {
				let [rows, fields] = await conn.query(query, [uuid])
				// if (error) throw new Error(error)
				if (rows.length > 0) {
					let result = {
						'id': rows[0].id,
						'first_name': (deserialize) ? encryption.decrypt(rows[0].first_name) : rows[0].first_name,
						'last_name': (deserialize) ? encryption.decrypt(rows[0].last_name) : rows[0].last_name,
						'phone': (deserialize) ? (rows[0].phone) ? encryption.decrypt(rows[0].phone) : '' : rows[0].phone,
						'email': (deserialize) ? encryption.decrypt(rows[0].email) : rows[0].email,
						'password': rows[0].password,
						'carrier': rows[0].carrier_id,
						'text_alerts': rows[0].text_alerts,
						'alerts': rows[0].alerts,
						'is_admin': rows[0].is_admin,
						'authorized': (rows[0].is_approved === 1) ? true : false,
						'uuid': rows[0].uuid
					}
					conn.release()
					resolve(result)
				} else {
					resolve(false)
				}
			})
			.catch(err => {
				reject(err)
			})
	})
}
