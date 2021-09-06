const ejs = require('ejs')
const path = require('path')
const encryption = require('./encryption')
const date = require('./date')
var socket_io = require('socket.io')
var io = socket_io()
const prayerModel = require('../models/prayer')
//const registerModel = require('../model/registration')
const usersModel = require('../models/users')
const prPartial = path.join(__dirname, '../views/partials/')

var socketApi = {}
socketApi.io = io

/*io.on('connection', (socket) => {
})*/

socketApi.user = io
	.of('/user-io')
	.on('connection', (socket) => {
		socket.on('new-user', (data) => {
			socket.broadcast.emit('add-new-user', data)
		}),
		socket.on('new-notification', (data) => {
			//socket.broadcast.emit('notification', data)
			socketApi.user.emit('notification', data)
		})
	})
/**
 * This mess needs to be completely overhauled to use modern async/await
 */
socketApi.prayer = io
	.of('/prayer-io')
	.on('connection', (socket) => {
		socket.on('pr-pagination', async (d) => {
			var message = JSON.parse(d)
			let prayerRequests = await prayerModel.getPublicPrayerRequests(message.latest, message.startingRequest, message.numberOfRequests).catch(e => { throw new Error(e) })
			let response = {}
			if (prayerRequests.length <= 0) {
				response.no_requests = true
				response.message = 'No Prayer Requests found!'
				socket.emit('add-pr', JSON.stringify(response))
			} else {
				let data = {
					pr: [],
					user: message.user
				}
				for (var i = 0; i < prayerRequests.length; i++) {
					if (prayerRequests[i].date) {
						prayerRequests[i].date = date.formatDate(prayerRequests[i].date, 'MM/DD/YYYY')
					}
					let pri = await prayerModel.getPrayerRequestInteractions(prayerRequests[i].id).catch(e => { throw new Error(e) })
					if (pri && pri.length > 0) {
						let interactions = []
						for (const uuid in pri) {
							let user = await usersModel.getUserName(uuid).catch(e => { throw new Error(e) })
							if (user) {
								interactions.push({ first_name: user.first_name, last_name: user.last_name })
							}
						}
						data.pr.push({
							id: prayerRequests[i].id,
							uuid: prayerRequests[i].uuid,
							name: encryption.decrypt(prayerRequests[i].first_name),
							request: encryption.decrypt(prayerRequests[i].request),
							date: prayerRequests[i].date,
							interactions: interactions
						})
						if (data.pr.length === prayerRequests.length) {
							ejs.renderFile(path.join(prPartial, 'prayer-requests-list.ejs'), data, (err, str) => {
								if (err) throw new Error(err)
								response.latest = (message.latest) ? message.latest : null
								response.startingRequest = message.startingRequest
								response.html = str.replace('/\r?\n|\r/', '')
								// send the response through the socket
								socket.emit('add-pr', JSON.stringify(response))
							})
						}
					} else { 
						data.pr.push({
							id: prayerRequests[i].id,
							uuid: prayerRequests[i].uuid,
							name: encryption.decrypt(prayerRequests[i].first_name),
							request: encryption.decrypt(prayerRequests[i].request),
							date: prayerRequests[i].date,
							interactions: false
						})
						if (prayerRequests.length === i + 1 && data.pr.length === prayerRequests.length) {
							ejs.renderFile(path.join(prPartial, 'prayer-requests-list.ejs'), data, (err, str) => {
								if (err) throw new Error(err)
								response.latest = (message.latest) ? message.latest : null
								response.startingRequest = message.startingRequest
								response.html = str.replace('/\r?\n|\r/', '')
								// send the response through the socket
								socket.emit('add-pr', JSON.stringify(response))
							})
						}
					}
				}
			}
		})
	})

socketApi.sendLatestPrayerRequest = (data) => {
	data.getData = true
	socketApi.prayer.emit('reload-pr', JSON.stringify(data))
}


/*socketApi.register = io
	.of('/register-io')
	.on('connection', (socket) => {
		socket.on('registration', (data, next) => {
			var registerUser = JSON.parse(data)
			var set = {
				'user_id': registerUser.regUser,
				'number_of_registrants': registerUser.regNum
			}
			registerModel.getRemainingRegistrations((results) => {
				if (results[0].remaining_registrations > 0 && results[0].remaining_registrations >= registerUser.regNum) {
					// append registration_max id to registerUser
					set.registration_max_id = results[0].id
					// update registration_max
					var updateRemReg = {
						'id': results[0].id,
						'remaining_registrations': results[0].remaining_registrations - registerUser.regNum
					}
					registerModel.updateRemainingRegistrations(updateRemReg, (results) => {
						if (results.changedRows > 0) {
							// Broadcast to the group that the remaining registrations has decreased.
							socketApi.sendUpdatedRemainingRegistration(updateRemReg)
							registerModel.addSundayRegistration(set, (results) => {
								if (results.insertId) {
									// send to the specific socket that send the original request
									next({ success: true, message: 'We look forward to seeing you on Sunday!' })

								} else {
									next({ error: true, message: 'Failed to add you to the registration.' })
								}
							})
						} else {
							next({ error: true, message: 'Failed to update remaining registrations.' })
						}
					})
				} else {
					next({ error: true, message: 'Uh-Oh! We are at max capacity! Please try a lower party number.' })
				}
			})
		})
		socket.on('get-num-registrations', () => {
			registerModel.getRemainingRegistrations((results) => {
				var data = {
					'id': (results[0]) ? results[0].id : null,
					'remaining_registrations': (results[0]) ? results[0].remaining_registrations : ''
				}
				socketApi.sendUpdatedRemainingRegistration(data)
			})
		})
	})

socketApi.sendUpdatedRemainingRegistration = (remainingRegistrations) => {
	socketApi.register.emit('updated-registrations', remainingRegistrations)
}*/

module.exports = socketApi