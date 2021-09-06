/* eslint-disable no-undef */
const mysql = require('mysql2/promise')
const settings = require('./appSettings').getSettings()
require('dotenv').config()

// Default the connection details
const options = {
	connectionLimit: 1000,
	host: settings.appDbServer,
	user: settings.appDbUser,
	password: settings.appDbPassword,
	database: settings.appDb,
	port: 3306
}
const pool = mysql.createPool(options)

exports.dbConnection = pool.getConnection()
exports.pool = pool
exports.options = options