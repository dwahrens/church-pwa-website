
/* eslint-disable no-unused-vars */
const db = require('../lib/db')

exports.addVideo = (set) => {
  return new Promise((resolve, reject) => {
    let q = 'INSERT INTO videos SET ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, set)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.updateVideo = (set) => {
  return new Promise((resolve, reject) => {
    let q = 'UPDATE videos SET url = ?, embedded_url = ?, title = ?, livestream = ?, private = ?, daily_devo_id = ? WHERE id = ?'
    let post = [
      set.url,
      set.embedded_url,
      set.title,
      set.private,
      set.daily_devo_id,
      set.id
    ]
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, post)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.deleteVideo = (id) => {
  return new Promise((resolve, reject) => {
    let q = 'DELETE FROM videos WHERE id = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, id)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.checkVideoExists = (url) => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT * FROM videos WHERE url = ?'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, url)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getSundaySchool = () => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT videos.id,videos.url FROM videos, videos_tag WHERE videos.tag = videos_tag.id AND videos_tag.tag = "sundayschool" AND videos.private=true ORDER BY videos.id DESC LIMIT 1'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getWednesdayEveningPrayer = () => {
  return new Promise((resolve, reject) => {
    // 1 = sermon, 2 = sundaymorning, 3 = wednesdayprayer
    let q = 'SELECT videos.id,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag WHERE videos.tag = videos_tag.id AND videos_tag.tag = "wednesdayprayer" ORDER BY videos.id DESC LIMIT 1'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getSundayMorningService = () => {
  return new Promise((resolve, reject) => {
    // 1 = sermon, 2 = sundaymorning, 3 = wednesdayprayer
    let q = 'SELECT videos.id,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag WHERE videos.tag = videos_tag.id AND videos_tag.tag = "sundaymorning" ORDER BY videos.id DESC LIMIT 1'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getSermon = (sermonId) => {
  return new Promise((resolve, reject) => {
    // 1 = sermon, 2 = sundaymorning, 3 = wednesdayprayer
    let q = 'SELECT videos.id,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag WHERE videos.sermon_id = ? AND videos.tag = videos_tag.id AND videos_tag.tag = "sermon" ORDER BY videos.id DESC LIMIT 1'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, [sermonId])
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getDailyDevotionalsBySeries = (num, start_devos_id, series_id) => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT videos.id,videos.title,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag,videos_daily_devos'
    q += ' WHERE videos.tag = videos_tag.id AND videos_tag.tag = "dailydevo" AND videos.daily_devo_id = videos_daily_devos.id AND videos_daily_devos.id = ?'
    let limitDevos = []
    if (start_devos_id) {
      var starting = start_devos_id - num
      if (starting < 0) {
        starting = 0
      }
      q += " AND videos.id BETWEEN ? AND ? ORDER BY videos.id DESC"
      limitDevos = [series_id, starting, start_devos_id]
    } else {
      q += " ORDER BY videos.id DESC LIMIT ?"
      limitDevos = [series_id, num]
    }
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, limitDevos)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getDailyDevotionals = (num, start_devos_id, series_id) => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT videos.id,videos.title,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag,videos_daily_devos'
    q += ' WHERE videos.tag = videos_tag.id AND videos_tag.tag = "dailydevo" AND videos.daily_devo_id = videos_daily_devos.id AND videos_daily_devos.id = ?'
    let limitDevos = []
    if (start_devos_id) {
      var starting = start_devos_id - num
      if (starting < 0) {
        starting = 0
      }
      q += " AND videos.id BETWEEN ? AND ? ORDER BY videos.id DESC"
      limitDevos = [series_id, starting, start_devos_id - 1]
    } else {
      q += " ORDER BY videos.id DESC LIMIT ?"
      limitDevos = [series_id, num]
    }
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q, limitDevos)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getAllDailyDevoTitles = () => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT * FROM videos_daily_devos'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getLivestream = () => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT videos.id,videos.url,videos.embedded_url,videos_tag.tag FROM videos,videos_tag WHERE videos.tag = videos_tag.id AND videos.livestream = true ORDER BY videos.id DESC LIMIT 1'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}

exports.getAllTags = () => {
  return new Promise((resolve, reject) => {
    let q = 'SELECT * FROM videos_tag'
    return db.pool.getConnection()
    .then(async conn => {
      let [rows, fields] = await conn.query(q)
      conn.release()
      resolve(rows)
    })
    .catch(err => {
      reject(err)
    })
  })
}