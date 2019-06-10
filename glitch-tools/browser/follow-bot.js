;(function() {
  let messages = require('../../messages')

  ;(function connectToBot() {
    let socket = new WebSocket(`ws://${process.env.PROJECT_NAME}.glitch.me`)

    socket.binaryType = 'arraybuffer'

    socket.onmessage = function(event) {
      let buffer = Buffer.from(event.data)

      if (
        snake === null ||
        buffer.readUInt8(0) !== messages.botPositionAndLength.type
      )
        return

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
