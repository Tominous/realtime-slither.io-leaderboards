let express = require('express')
let path = require('path')

let router = express.Router()

router.get('/', function(_request, response) {
  response
    .status(200)
    .sendFile(path.join(process.cwd(), 'frontend', 'main.html'))
})

router.get('/main.css', function(_request, response) {
  response
    .status(200)
    .sendFile(path.join(process.cwd(), 'frontend', 'main.css'))
})

router.get('/main.js', function(_request, response) {
  response.status(200).sendFile(path.join(process.cwd(), 'frontend', 'main.js'))
})

module.exports = router
