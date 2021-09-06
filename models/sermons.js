/* eslint-disable no-unused-vars */
const db = require('../lib/db')

exports.filterSermons = (filter) => {
  return new Promise((resolve, reject) => {
    let set = []
    let query = 'SELECT sermon.id AS id, sermon.title AS title, sermon.date AS date, sermon.file AS file,'
    query += ' service.name AS service_name, service.time AS time, series.name AS series_name,'
    query += ' speaker.first_name AS first_name, speaker.last_name AS last_name,'
    query += ' sermon.passage_start_id AS passage_start_id, sermon.passage_end_id AS passage_end_id'
    query += ' FROM sermon,speaker,service,series WHERE sermon.speaker_id = speaker.id AND'
    query += ' sermon.service_id = service.id AND sermon.series_id = series.id'
    if (filter.preacher) {
      query += ' AND speaker.id = ?'
      set.push(filter.preacher)
    }

    if (filter.series) {
      query += ' AND series.id = ?'
      set.push(filter.series)
    }

    if (filter.keywords) {
      query += ' AND sermon.title LIKE "%?%"'
      set.push(filter.keywords)
    }

    switch (filter.sort) {
      case 'date':
        query += 'ORDER BY sermon.date DESC'
        break
      case 'preacher':
        query += 'ORDER BY speaker.last_name'
        break
      case 'title':
        query += ' ORDER BY sermon.title'
        break
    }
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

exports.updateSermon = (sermon) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE sermon SET speaker_id = ?, service_id = ?, series_id = ?, video_id =?,'
    query += ' passage_start_id = ?, passage_end_id = ?, title = ?, date = ?, file = ?'
    query += ' WHERE id = ?'
    let post = [
      sermon.speaker_id,
      sermon.service_id,
      sermon.series_id,
      sermon.video_id,
      sermon.passage_start_id,
      sermon.passage_end_id,
      sermon.title,
      sermon.date,
      sermon.file,
      sermon.id
    ]
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, post)
      // if (error) throw new Error(error)
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
    
  })
}

// deletes a sermon by id
exports.deleteSermon = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'DELETE FROM sermon WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, id)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

// return range of sermons
exports.getSermonsRange = (number, startingSermon) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT s.id AS id, s.title AS title, s.date AS date, s.file AS file, se.name AS service_name, se.time AS time, '
    query += 'se.id AS service_id, sr.name AS series_name, sr.id AS series_id, sp.first_name AS first_name, '
    query += 'sp.last_name AS last_name, sp.id AS speaker_id, s.passage_start_id AS passage_start_id, '
    query += 's.passage_end_id AS passage_end_id, v.url AS video_url, v.embedded_url AS embedded_url '
    query += 'FROM sermon s LEFT JOIN videos v ON s.video_id = v.id LEFT JOIN speaker sp ON s.speaker_id = sp.id '
    query += 'LEFT JOIN service se ON s.service_id = se.id LEFT JOIN series sr ON s.series_id = sr.id'
    var limitSermons = []
    if (startingSermon) {
      var starting = startingSermon - number
      if (starting < 0) {
        starting = 0
      }
      query += ' WHERE s.id BETWEEN ? AND ? ORDER BY s.id DESC'
      limitSermons = [starting, startingSermon - 1]
    } else {
      query += ' ORDER BY s.id DESC LIMIT ?'
      limitSermons = [number]
    }
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, limitSermons)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}
// return the last three sermons in the db.
exports.getXSermons = (number) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT s.id AS id, s.title AS title, s.date AS date, s.file AS file, se.name AS service_name, se.time AS time, '
    query += 'se.id AS service_id, sr.name AS series_name, sr.id AS series_id, sp.first_name AS first_name, '
    query += 'sp.last_name AS last_name, sp.id AS speaker_id, s.passage_start_id AS passage_start_id, '
    query += 's.passage_end_id AS passage_end_id, v.url AS video_url, v.embedded_url AS embedded_url '
    query += 'FROM sermon s LEFT JOIN videos v ON s.video_id = v.id LEFT JOIN speaker sp ON s.speaker_id = sp.id '
    query += 'LEFT JOIN service se ON s.service_id = se.id LEFT JOIN series sr ON s.series_id = sr.id ORDER BY s.date DESC LIMIT ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, number)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}
// return all of the sermons in the db.
exports.getAllSermons = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM sermon,speaker,service,series '
    query += 'WHERE speaker_id = speaker.id AND service_id = service.id AND series_id = series.id'
    query += ' ORDER BY sermon.date DESC'
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

exports.getSingleSermon = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT s.id AS id, s.count AS count, s.title AS title, s.date AS date, s.file AS file, se.name AS service_name, se.time AS time, '
    query += 'se.id AS service_id, sr.name AS series_name, sr.id AS series_id, sp.first_name AS first_name, '
    query += 'sp.last_name AS last_name, sp.id AS speaker_id, s.passage_start_id AS passage_start_id, '
    query += 's.passage_end_id AS passage_end_id, v.url AS video_url, v.embedded_url AS embedded_url '
    query += 'FROM sermon s LEFT JOIN videos v ON s.video_id = v.id LEFT JOIN speaker sp ON s.speaker_id = sp.id '
    query += 'LEFT JOIN service se ON s.service_id = se.id LEFT JOIN series sr ON s.series_id = sr.id WHERE s.id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, id)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getPassage = (passage_id) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT books.name as book_name, books.id as book_id, passage.chapter as chapter, passage.verse as verse'
    query += ' FROM passage,books WHERE passage.book_id = books.id AND passage.id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, passage_id)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getAllBooks = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM books'
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

exports.getAllServices = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM service'
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

exports.getAllSeries = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM series'
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

exports.getAllSpeakers = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM speaker'
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

exports.addPassage = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO passage SET ?'
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

exports.addSermon = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO sermon SET ?'
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

exports.addService = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO service SET ?'
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

exports.addSeries = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO series SET ?'
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

exports.addSpeaker = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO speaker SET ?'
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

exports.updateSermonCount = (count, id) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE sermon SET count = ? WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(query, [count, id])
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}
