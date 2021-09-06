const crypto = require('crypto')
const bcrypt = require('bcrypt')
const settings = require('./appSettings').getSettings()
const algorithm = 'aes-256-cbc'
const key = settings.appKey
const IV_LENGTH = parseInt(settings.ivLength)
const SALT_ROUNDs = parseInt(settings.saltRounds)

// Helper functions - Move to a Lib folder
const encrypt = (text) => {
	let iv = crypto.randomBytes(IV_LENGTH)
	let cipher = crypto.createCipheriv(algorithm, key, iv)
	let encrypted = cipher.update(text)

	encrypted = Buffer.concat([encrypted, cipher.final()])

	return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// Move to Lib
const decrypt = (text) => {
	let textParts = text.split(':')
	let iv = Buffer.from(textParts.shift(), 'hex')
	let encryptedText = Buffer.from(textParts.join(':'), 'hex')
	let decipher = crypto.createDecipheriv(algorithm, key, iv)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}

const hash = (text) => {
	return crypto.createHash('md5').update(text + settings.hash).digest('hex')
}

const hashPassword = (text, next) => {
	bcrypt.hash(text, SALT_ROUNDs, function(err, hash) {
    // Store hash in your password DB.
		if (err) throw new Error(err)
		next(hash)
	})
}

exports.encrypt = encrypt
exports.decrypt = decrypt
exports.hash = hash
exports.hashPassword = hashPassword