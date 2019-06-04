let express = require('express')
let path = require('path')

module.exports = function() {
  let router = express.Router()

  router.get('/', function(_request, response) {
    response
      .status(200)
      .sendFile(path.join(process.cwd(), 'frontend', 'main.html'))
  })

  router.get('/main.bundle.js', function(_request, response) {
    response
      .status(200)
      .sendFile(path.join(process.cwd(), 'frontend', 'main.bundle.js'))
  })

  return router
}
