const db = require('../lib/db')
/**
 * 
 * This is a legacy module that could have been used for the C19 pandemic. Essentially it supports folks sigining up for a service. The stack could be used elsewhere such as bring a meal, nursery, etc.
 */

/**
 * 
 * @param {*} data 
 * @param {*} next 
 */
exports.addSundayRegistration = (data, next) => {
	// First - get the number of registrations left
	/*db.pool.query('SELECT id,remaining_registrations FROM sm_registration_max WHERE attendance_date = ?', data.date, function(error, results, fields) {
		if (error) throw error
		if (results[0].remaining_registrations > 0) {
      rem_reg = results[0].remaining_registrations
      data.registration_max = results[0].id
			// Then insert into the registration table
			db.pool.query('INSERT INTO sm_registration SET ?', data, function(error, results, fields) {
				if (error) throw error
				if (results.insertId) {
					var remaining = rem_reg - data.number_of_registrants
					// Update the remaining registrations.
					db.pool.query('UPDATE sm_registration_max SET remaining_registrations = ?', remaining, function(error, results, fields) {
						if (error) throw error
						res.filledUp = false
						res.message = "You have been registered to come on Sunday " + data.date 
						next(res)
					})
				}
			})
		} else {
			res.filledUp = true
			res.message = "Uh-Oh! It looks like we will be at capacity this Sunday. Please try to reserve a spot again next week!"
			next(res)
		}
	})*/
	db.pool.query('INSERT INTO sm_registration SET ?', data, (error, results) => {
		if (error) throw new Error(error)
		next(results)
	})
}

exports.getRemainingRegistrations = (next) => {
	db.pool.query('SELECT id,remaining_registrations FROM sm_registration_max ORDER BY id LIMIT 1', (error, results) => {
		if (error) throw new Error(error)
		next(results)
	})
}

exports.updateRemainingRegistrations = (data, next) => {
	db.pool.query('UPDATE sm_registration_max SET remaining_registrations = ? WHERE id = ?', [data.remaining_registrations, data.id], (error, results) => {
		if (error) throw new Error(error)
		next(results)
	})
}

exports.scheduleRegistration = (data, next) => {
	db.pool.query('INSERT INTO sm_registration_max SET ?', data, (error, results) => {
		if (error) throw new Error(error)
		next(results)
	})
}