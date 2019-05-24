;(function() {
  ;(function connectToBot() {
    let socket = new WebSocket('ws://rsl.glitch.me')

    socket.binaryType = 'arraybuffer'

    socket.onmessage = function(event) {
      if (snake === null) return

      let view = new DataView(event.data)
      let offset = 0

      let type = view.getUint8(offset)

      if (type !== 2) return

      offset++

      let serverLength = view.getUint8(offset)
      offset++

      let server = Array.from(new Uint8Array(event.data.slice(offset, offset + serverLength))).map(function(code) {
        return String.fromCharCode(code)
      }).join('')

      if (server !== `${bso.ip}:${bso.po}`) return

      offset += serverLength

      let x = view.getUint16(offset)
      offset += 2

      let y = view.getUint16(offset)
      offset += 2

      xm = x - snake.xx
      ym = y - snake.yy

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
