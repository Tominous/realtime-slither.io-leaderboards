// This will make your snake follow the bot of the server you're in

;(function() {
  let textDecoder = new TextDecoder('utf-8')

  ;(function connectToBot() {
    let socket = new WebSocket('ws://rsl.glitch.me')

    socket.binaryType = 'arraybuffer'

    socket.onmessage = function(event) {
      if (snake === null) return

      let view = new DataView(event.data)
      let offset = 0

      let type = view.getUint8(offset)
      offset++

      if (type !== 2) return

      let serverLength = view.getUint8(offset)
      offset++

      let server = textDecoder.decode(
        event.data.slice(offset, offset + serverLength)
      )

      if (server !== `${bso.ip}:${bso.po}`) return

      offset += serverLength

      let x = view.getUint16(offset)
      offset += 2

      let y = view.getUint16(offset)
      offset += 2

      xm = x - snake.xx
      ym = y - snake.yy

      let distanceX = Math.abs(Math.round(x - snake.xx))
      let distanceY = Math.abs(Math.round(y - snake.yy))
      let distance = distanceX + distanceY

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
