let express = require('express')
let bytes = require('bytes')
let fs = require('fs').promises
let path = require('path')

module.exports = async function() {
  let router = express.Router()

  router.get('/heap-used', function(_request, response) {
    let memoryUsage = process.memoryUsage()

    response.status(200).json({
      bytes: memoryUsage.heapUsed,
      formatted: bytes.format(memoryUsage.heapUsed)
    })
  })

  let followBotBundlePath = path.join(
    process.cwd(),
    'glitch-tools',
    'browser',
    'follow-bot.bundle.js'
  )

  try {
    await fs.access(followBotBundlePath)

    router.get('/glitch-tools/browser/follow-bot.bundle.js', function(
      _request,
      response
    ) {
      response.status(200).sendFile(followBotBundlePath)
    })
  } catch (error) {
    console.error(error.message)
    console.error('Not adding follow Glitch bot bundle route.')
  }

  return router
}
