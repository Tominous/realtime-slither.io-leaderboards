;(function() {
  let messages = require('../../messages')

  let host =
    typeof process.env.PROJECT_NAME !== 'undefined'
      ? `${process.env.PROJECT_NAME}.glitch.me`
      : undefined

  while (!host) {
    host = prompt(
      'Enter the host (ip:port or domain name) of the feeder',
      'localhost:3000'
    )
  }

  ;(function connectToBot() {
    let socket = new WebSocket(`ws://${host}`)

    socket.binaryType = 'arraybuffer'

    socket.onmessage = function(event) {
      if (snake === null) return

      let buffer = Buffer.from(event.data)

      if (buffer.readUInt8(0) !== messages.botPositionAndLength.type) return

      let decoded = messages.botPositionAndLength.decode(buffer)

      if (decoded.server !== `${bso.ip}:${bso.po}`) return

      xm = decoded.x - snake.xx
      ym = decoded.y - snake.yy

      let distance = Math.abs(xm | 0) + Math.abs(ym | 0)

      document.title = `Distance: ${distance}`
    }

    socket.onclose = function() {
      setTimeout(function() {
        connectToBot()
      }, 1000)
    }

    socket.onerror = function() {
      socket.close()
    }
  })()
})()
