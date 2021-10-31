const jwt = require("express-jwt");
const { CONFIG } = require('./../helpers/config')

const authenticate = jwt({
	secret: CONFIG.JWT_SECRET,
	algorithms: ['HS256']
});

module.exports = authenticate;
