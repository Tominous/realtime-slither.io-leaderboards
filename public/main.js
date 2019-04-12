/* global WebSocket, location */

(function () {
  let td = new TextDecoder('utf-8')

  let cache = Object.create(null)

  let ws = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/`)

  ws.binaryType = 'arraybuffer'

  ws.onmessage = function (event) {
    let v = new DataView(event.data)
    let o = 0

    let type = v.getUint8(o)
    o++

    let sl = v.getUint8(o)
    o++

    let s = td.decode(event.data.slice(o, o + sl))
    o += sl

    let cached = cache[s]

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

      cached = cache[s] = {
        leaderboard,
        canvas,
        ctx
      }
    }

    switch (type) {
      case 0: {
        let leaderboard = []

        let tp = v.getUint16(o)
        o += 2

        let ts = 0

        while (o < event.data.byteLength) {
          let nl = v.getUint8(o)
          o++

          let nick = td.decode(event.data.slice(o, o + nl))
          o += nl

          let length = (v.getUint16(o) << 8) + v.getUint8(o + 2)
          o += 3

          ts += length

          leaderboard.push({
            nick,
            length
          })
        }

        cached.leaderboard.innerText = `${s}

      Total players: ${tp}
      Total score: ${ts}

      #1 ${leaderboard[0].nick} ${leaderboard[0].length}
      #2 ${leaderboard[1].nick} ${leaderboard[1].length}
      #3 ${leaderboard[2].nick} ${leaderboard[2].length}
      #4 ${leaderboard[3].nick} ${leaderboard[3].length}
      #5 ${leaderboard[4].nick} ${leaderboard[4].length}
      #6 ${leaderboard[5].nick} ${leaderboard[5].length}
      #7 ${leaderboard[6].nick} ${leaderboard[6].length}
      #8 ${leaderboard[7].nick} ${leaderboard[7].length}
      #9 ${leaderboard[8].nick} ${leaderboard[8].length}
      #10 ${leaderboard[9].nick} ${leaderboard[9].length}`

        break
      }

      case 1: {
        cached.ctx.clearRect(0, 0, cached.canvas.width, cached.canvas.height)

        let i = 0

        while (o < event.data.byteLength) {
          if (v.getUint8(o) === 1) { cached.ctx.fillRect((i % 80) + 80 - 80 + 12, (i / 80) + 80 - 80 + 12, 1, 1) }

          i++
          o++
        }

        break
      }
    }
  }
})()
