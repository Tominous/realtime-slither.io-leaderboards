let express = require('express')

module.exports = function() {
  let router = express.Router()

  router.ws('/', function() {})

  return router
}
