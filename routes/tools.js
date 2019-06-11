let express = require('express')
let path = require('path')

module.exports = function() {
  let router = express.Router()

  router.get('/tools/browser/follow-bot/main.bundle.js', function(
    _request,
    response
  ) {
    response
      .status(200)
      .sendFile(
        path.join(
          process.cwd(),
          'tools',
          'browser',
          'follow-bot',
          'main.bundle.js'
        )
      )
  })

  return router
}
