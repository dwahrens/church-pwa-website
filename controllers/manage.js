const secured = require('../lib/secured')
const date = require('../lib/date')
const events = require('../models/events')
const users = require('../models/users')
const reading = require('../models/reading')
const sermons = require('../models/sermons')
const videos = require('../models/videos')


exports.manage = (req, res) => {
	secured.check(req, res, async (req, res) => {
		let isAdmin = await users.checkIfAdmin(req.user).catch(e => { throw new Error(e) })
		if (isAdmin) {
			// Need to read from a settings table for everything that is enabled. Hardcoding for now (bad practice)
			let data = {
				'registration': false,
				'events': []
			}
			data.members = await users.getAllUsers().catch(e => { throw new Error(e) })
			data.authors = await reading.getAuthorsByFirstNameAlphabetical().catch(e => { throw new Error(e) })
			data.reading = await reading.getAllReadingForManagement().catch(e => { throw new Error(e) })
			data.books = await sermons.getAllBooks().catch(e => { throw new Error(e) })
			data.series = await sermons.getAllSeries().catch(e => { throw new Error(e) })
			data.services = await sermons.getAllServices().catch(e => { throw new Error(e) })
			data.speakers = await sermons.getAllSpeakers().catch(e => { throw new Error(e) })
			let sermonsResult = await sermons.getXSermons(10).catch(e => { throw new Error(e) })
			data.sermons = []
			for(var s = 0; s < sermonsResult.length; s++) {
				sermonsResult[s].date = date.formatDate(sermonsResult[s].date, 'MM/DD/YYYY')
				if (sermonsResult[s].passage_start_id && sermonsResult[s].passage_end_id) {
					let start_passage = await sermons.getPassage(sermonsResult[s].passage_start_id).catch(e => { throw new Error(e) })
					sermonsResult[s].passage_start = {
						book_name: start_passage[0].book_name,
						book_id: start_passage[0].book_id,
						chapter: start_passage[0].chapter,
						verse: start_passage[0].verse,
					}
					sermonsResult[s].passage = start_passage[0].book_name + " " + start_passage[0].chapter + ":" + start_passage[0].verse
					let end_passage = await sermons.getPassage(sermonsResult[s].passage_end_id).catch(e => { throw new Error(e) })
					sermonsResult[s].passage_end = {
						book_name: end_passage[0].book_name,
						book_id: start_passage[0].book_id,
						chapter: end_passage[0].chapter,
						verse: end_passage[0].verse,
					}
					data.sermons.push(sermonsResult[s])
				} else {
					data.sermons.push(sermonsResult[s])
				}
			}
			data.videoTags = await videos.getAllTags().catch(e => { throw new Error(e) })
			let timeline = await events.getAllEvents().catch(e => { throw new Error(e) })
			let i = 0
			timeline.forEach((ev) => {
				data.events[i] = {
					'id': ev.id,
					'title': ev.title,
					'date': date.formatDate(ev.date, 'MM-DD-YYYY'),
					'start_time': ev.start_time,
					'end_time': ev.end_time
				}
				i++
			})
			data.sermons.sort((a, b) => (a.id < b.id) ? 1 : -1)
			var length = data.sermons.length - 1
			var lastSermon = data.sermons[length]
			data.lastId = lastSermon.id ? lastSermon.id : 0
			data.firstId = data.sermons.length > 0 ? data.sermons[0].id : 0
			res.render('manage', data)
		} else {
			res.redirect('/public/livestream')
		}
	})
}