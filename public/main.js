/* global WebSocket, location */

(function () {
  let cache = Object.create(null)

  let ws = new WebSocket(`${location.protocol.replace('http', 'ws')}//${location.host}/`)

  ws.onmessage = function (event) {
    let json = JSON.parse(event.data)
    let cached = cache[json.server]

    if (!cached) {
      let container = document.createElement('div')
      container.style.display = 'inline-block'
      container.style.border = '1px solid #4CAF50'
      container.style.width = '400px'
      container.style.height = '350px'

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

      cached = cache[json.server] = {
        leaderboard,
        canvas,
        ctx
      }
    }

    switch (json.type) {
      case 'leaderboard': {
        let totalScore = 0

        for (let s of json.leaderboard) {
          totalScore += s.length
        }

        cached.leaderboard.innerText = `${json.server}

      Total score: ${totalScore}
      Total players: ${json.totalPlayers}

      #1 ${json.leaderboard[0].nickname} ${json.leaderboard[0].length}
      #2 ${json.leaderboard[1].nickname} ${json.leaderboard[1].length}
      #3 ${json.leaderboard[2].nickname} ${json.leaderboard[2].length}
      #4 ${json.leaderboard[3].nickname} ${json.leaderboard[3].length}
      #5 ${json.leaderboard[4].nickname} ${json.leaderboard[4].length}
      #6 ${json.leaderboard[5].nickname} ${json.leaderboard[5].length}
      #7 ${json.leaderboard[6].nickname} ${json.leaderboard[6].length}
      #8 ${json.leaderboard[7].nickname} ${json.leaderboard[7].length}
      #9 ${json.leaderboard[8].nickname} ${json.leaderboard[8].length}
      #10 ${json.leaderboard[9].nickname} ${json.leaderboard[9].length}`

        break
      }

      case 'minimap': {
        cached.ctx.clearRect(0, 0, cached.canvas.width, cached.canvas.height)

        for (let i = 0; i < json.minimap.length; i++) {
          if (json.minimap[i]) { cached.ctx.fillRect((i % 80) + 80 - 80 + 12, (i / 80) + 80 - 80 + 12, 1, 1) }
        }

        break
      }
    }
  }
})()
