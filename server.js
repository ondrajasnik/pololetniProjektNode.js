const express = require('express') // Načtení knihovny Express pro vytvoření webového serveru
const app = express() // Vytvoření instance aplikace Express

const http = require('http') // Načtení modulu HTTP pro vytvoření serveru
const server = http.createServer(app) // Vytvoření HTTP serveru pomocí aplikace Express
const { Server } = require('socket.io') // Načtení knihovny Socket.io pro obousměrnou komunikaci v reálném čase
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 }) // Vytvoření instance Socket.io serveru s nastavením intervalu a časového limitu pro ping

const port = 3000 // Nastavení portu, na kterém bude server naslouchat

app.use(express.static('public')) // Nastavení statického souborového serveru pro složku 'public'

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html') // Obsluha GET požadavku na kořenovou URL, vrátí soubor 'index.html'
})

const backEndPlayers = {} // Objekt pro ukládání informací o hráčích
const backEndProjectiles = {} // Objekt pro ukládání informací o projektilů

const rychlost = 4 // Rychlost pohybu hráče
const RADIUS = 10 // Poloměr hráče
const PROJECTILE_RADIUS = 5 // Poloměr projektilu
let projectileId = 0 // Proměnná pro generování unikátních ID projektilů

io.on('connection', (socket) => {
  console.log('a user connected') // Logování připojení nového uživatele

  io.emit('updatePlayers', backEndPlayers) // Odeslání aktuálního stavu hráčů všem klientům

  socket.on('shoot', ({ x, y, angle }) => {
    // Obsluha události střelby
    projectileId++ // Zvýšení ID projektilu

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    } // Výpočet rychlosti projektilu na základě úhlu

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    } // Uložení projektilu do objektu 'backEndProjectiles'

    console.log(backEndProjectiles) // Logování aktuálních projektilů
  })

  socket.on('initGame', ({ username, width, height }) => {
    // Obsluha inicializace hry pro nového hráče
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    } // Nastavení náhodné pozice a barvy hráče

    backEndPlayers[socket.id].canvas = {
      width,
      height
    } // Uložení velikosti plátna hráče

    backEndPlayers[socket.id].radius = RADIUS // Nastavení poloměru hráče
  })

  socket.on('disconnect', (reason) => {
    // Obsluha odpojení hráče
    console.log(reason) // Logování důvodu odpojení
    delete backEndPlayers[socket.id] // Odstranění hráče z objektu 'backEndPlayers'
    io.emit('updatePlayers', backEndPlayers) // Odeslání aktuálního stavu hráčů všem klientům
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    // Obsluha stisknutí klávesy hráčem
    const backEndPlayer = backEndPlayers[socket.id]

    if (!backEndPlayers[socket.id]) return // Kontrola, zda hráč stále existuje

    backEndPlayers[socket.id].sequenceNumber = sequenceNumber // Aktualizace sekvenčního čísla
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= rychlost // Pohyb nahoru
        break

      case 'KeyA':
        backEndPlayers[socket.id].x -= rychlost // Pohyb doleva
        break

      case 'KeyS':
        backEndPlayers[socket.id].y += rychlost // Pohyb dolů
        break

      case 'KeyD':
        backEndPlayers[socket.id].x += rychlost // Pohyb doprava
        break
    }

    const playerSides = {
      left: backEndPlayer.x - backEndPlayer.radius,
      right: backEndPlayer.x + backEndPlayer.radius,
      top: backEndPlayer.y - backEndPlayer.radius,
      bottom: backEndPlayer.y + backEndPlayer.radius
    } // Výpočet hranic hráče

    if (playerSides.left < 0) backEndPlayers[socket.id].x = backEndPlayer.radius // Kontrola, zda hráč nepřekročil levý okraj

    if (playerSides.right > 1024)
      backEndPlayers[socket.id].x = 1024 - backEndPlayer.radius // Kontrola, zda hráč nepřekročil pravý okraj

    if (playerSides.top < 0) backEndPlayers[socket.id].y = backEndPlayer.radius // Kontrola, zda hráč nepřekročil horní okraj

    if (playerSides.bottom > 576)
      backEndPlayers[socket.id].y = 576 - backEndPlayer.radius // Kontrola, zda hráč nepřekročil spodní okraj
  })
})

setInterval(() => {
  // Aktualizace stavu projektilů a hráčů každých 15 ms
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y // Aktualizace pozice projektilu

    if (
      backEndProjectiles[id].x - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS >=
        backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
    ) {
      delete backEndProjectiles[id] // Odstranění projektilu, pokud opustil hranice plátna
      continue
    }

    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]

      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      ) // Výpočet vzdálenosti mezi projektil a hráčem

      if (
        DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        if (backEndPlayers[backEndProjectiles[id].playerId])
          backEndPlayers[backEndProjectiles[id].playerId].score++ // Zvýšení skóre střelce, pokud projektil zasáhl jiného hráče

        console.log(backEndPlayers[backEndProjectiles[id].playerId])
        delete backEndProjectiles[id] // Odstranění projektilu
        delete backEndPlayers[playerId] // Odstranění zasaženého hráče
        break
      }
    }
  }

  io.emit('updateProjectiles', backEndProjectiles) // Odeslání aktuálního stavu projektilů všem klientům
  io.emit('updatePlayers', backEndPlayers) // Odeslání aktuálního stavu hráčů všem klientům
}, 15)

server.listen(port, () => {
  console.log(`server naslouchá na portu: ${port}`) // Server naslouchá na portu 3000
})

console.log('server se načetl') // Logování, že server se načetl
