/* global WebSocket, location */

(function () {
  let textDecoder = new TextDecoder('utf-8')

  let cache = Object.create(null)

  let ws = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/`)

  ws.binaryType = 'arraybuffer'

  ws.onmessage = function (event) {
    let view = new DataView(event.data)
    let offset = 0

    let type = view.getUint8(offset)
    offset++

    let serverLength = view.getUint8(offset)
    offset++

    let server = textDecoder.decode(event.data.slice(offset, offset + serverLength))
    offset += serverLength

    let cached = cache[server]

    if (!cached) {
      let container = document.createElement('div')
      container.style.display = 'inline-block'
      container.style.border = '1px solid #4CAF50'
      container.style.width = '400px'
      container.style.height = '370px'

      let leaderboard = document.createElement('div')
      container.appendChild(leaderboard)

      let canvas = document.createElement('canvas')
      canvas.width = 104
      canvas.height = 104
      canvas.style.width = '104px'
      canvas.style.height = '104px'

      let ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(255, 255, 255, 0.40)'

      container.appendChild(canvas)

      document.body.appendChild(container)

      cached = cache[server] = {
        leaderboard,
        canvas,
        ctx
      }
    }

    switch (type) {
      case 0: {
        let leaderboard = []

        let totalPlayers = view.getUint16(offset)
        offset += 2

        let totalScore = 0

        while (offset < event.data.byteLength) {
          let nicknameLength = view.getUint8(offset)
          offset++

          let nickname = textDecoder.decode(event.data.slice(offset, offset + nicknameLength))
          offset += nicknameLength

          let length = (view.getUint16(offset) << 8) + view.getUint8(offset + 2)
          offset += 3

          totalScore += length

          leaderboard.push({
            nickname,
            length
          })
        }

        cached.leaderboard.innerText = `${server}

      Total players: ${totalPlayers}
      Total score: ${totalScore}

      #1 ${leaderboard[0].nickname} ${leaderboard[0].length}
      #2 ${leaderboard[1].nickname} ${leaderboard[1].length}
      #3 ${leaderboard[2].nickname} ${leaderboard[2].length}
      #4 ${leaderboard[3].nickname} ${leaderboard[3].length}
      #5 ${leaderboard[4].nickname} ${leaderboard[4].length}
      #6 ${leaderboard[5].nickname} ${leaderboard[5].length}
      #7 ${leaderboard[6].nickname} ${leaderboard[6].length}
      #8 ${leaderboard[7].nickname} ${leaderboard[7].length}
      #9 ${leaderboard[8].nickname} ${leaderboard[8].length}
      #10 ${leaderboard[9].nickname} ${leaderboard[9].length}`

        break
      }

      case 1: {
        cached.ctx.clearRect(0, 0, cached.canvas.width, cached.canvas.height)

        let i = 0

        while (offset < event.data.byteLength) {
          if (view.getUint8(offset) === 1) { cached.ctx.fillRect((i % 80) + 80 - 80 + 12, (i / 80) + 80 - 80 + 12, 1, 1) }

          i++
          offset++
        }

        break
      }
    }
  }
})()
