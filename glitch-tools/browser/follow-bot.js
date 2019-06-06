;(function() {
  let messages = require('../../messages')

  ;(function connectToBot() {
    let socket = new WebSocket('ws://rsl.glitch.me')

    socket.binaryType = 'arraybuffer'

    socket.onmessage = function(event) {
      if (snake === null) return

      let decoded = messages.botPositionAndLength.decode(
        Buffer.from(event.data)
      )

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
