/* eslint-disable no-unused-vars */
const db = require('../lib/db')

/**
 * addMealRequest - Inserts a meal request
 * @param {*} post 
 * @returns Promise 
 */
exports.addMealRequest = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO make_a_meal_request SET ?'
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

/**
 * updateMealRequest - updates the meal request by Id
 * @param {*} post 
 * @returns 
 */
exports.updateMealRequest = (post, id) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE make_a_meal_request SET ? WHERE id = ?'
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

/**
 * deleteMealRequest - delets the meal request by id
 * @param {*} post 
 * @returns 
 */
exports.deleteMealRequest = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'DELETE FROM make_a_meal_request WHERE id = ?'
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

/**
 * getMealRequestById - gets the meal request using the id
 * @param {*} post 
 * @returns 
 */
exports.getMealRequestById = (id) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM make_a_meal_request WHERE id = ?'
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

/**
 * getAllMealRequests - retrieves all of the meals
 * @param {*} post 
 * @returns 
 */
exports.getAllMealRequests = () => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM make_a_meal_request'
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

/**
 * addMeal - adds a meal entry
 * @param {*} post 
 * @returns 
 */
exports.addMeal = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'INSERT INTO make_a_meal SET ?'
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

/**
 * updateMeal - updates the meal entry
 * @param {*} post 
 * @returns 
 */
exports.updateMeal = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE make_a_meal SET ?'
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

/**
 * deleteMeal - deletes the meal entry
 * @param {*} post 
 * @returns 
 */
exports.deleteMeal = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'DELETE FROM make_a_meal WHERE id = ?'
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

/**
 * getMealById - gets the meal using the id
 * @param {*} post 
 * @returns 
 */
exports.getMealById = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM make_a_meal WHERE id = ?'
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

/**
 * getMealsByRequest - gets all fof the meals using the request id
 * @param {*} post 
 * @returns 
 */
exports.getMealsByRequest = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM make_a_meal WHERE request_id = ?'
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

/**
 * getAllMeals - selects everything from the make a meal table
 * @param {*} post 
 * @returns 
 */
exports.getAllMeals = (post) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM make_a_meal'
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