/* eslint-disable no-unused-vars */
const db = require('../lib/db')

exports.addAuthor = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO authors SET ?'
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

exports.addReading = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO reading SET ?'
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

exports.getReadingsTitleAlphabetical = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM reading ORDER BY title'
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

exports.getAuthorsByFirstNameAlphabetical = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM authors ORDER BY first_name'
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

exports.getAllReadingForManagement = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT reading.title as title, reading.authors_id as authors_id, reading.link as link, '
    query += 'authors.first_name as author_first_name, authors.last_name as author_last_name '
    query += 'FROM reading,authors ORDER BY reading.id'
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