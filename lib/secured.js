exports.check = function (req, res, next) {
	if (req.user) { 
		next(req, res)
	} else {
		req.session.returnTo = req.originalUrl
		res.redirect('/login')
	}
}