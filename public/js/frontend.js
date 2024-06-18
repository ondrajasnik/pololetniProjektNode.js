// Výběr prvku <canvas> a získání 2D kontextu pro kreslení
const platno = document.querySelector('canvas')
const c = platno.getContext('2d')

// Inicializace socket.io klienta
const socket = io()

// Výběr prvku pro zobrazení skóre
const scoreEl = document.querySelector('#scoreEl')

// Poměr obrazovky pro správné měřítko na zařízeních s vyšší hustotou pixelů
const pomerObrazovky = window.devicePixelRatio || 1

// Nastavení šířky a výšky plátna s ohledem na poměr obrazovky
platno.width = 1024 * devicePixelRatio
platno.height = 576 * devicePixelRatio

// Nastavení měřítka kontextu podle poměru obrazovky
c.scale(devicePixelRatio, devicePixelRatio)

// Inicializace středu plátna
const x = platno.width / 2
const y = platno.height / 2

// Objekty pro ukládání hráčů a projektilů na straně klienta
const frontEndPlayers = {}
const frontEndProjectiles = {}

// Příjem aktualizací projektilů ze serveru
socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    // Přidání nového projektilu, pokud ještě neexistuje
    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    } else {
      // Aktualizace pozice existujícího projektilu
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }
  }

  // Odstranění projektilů, které už na serveru neexistují
  for (const frontEndProjectileId in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectileId]) {
      delete frontEndProjectiles[frontEndProjectileId]
    }
  }
})

// Příjem aktualizací hráčů ze serveru
socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    // Přidání nového hráče, pokud ještě neexistuje
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username
      })

      // Aktualizace seznamu hráčů na obrazovce
      document.querySelector(
        '#playerLabels'
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`
    } else {
      // Aktualizace existujícího hráče
      document.querySelector(
        `div[data-id="${id}"]`
      ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`

      document
        .querySelector(`div[data-id="${id}"]`)
        .setAttribute('data-score', backEndPlayer.score)

      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      // Seřazení hráčů podle skóre
      childDivs.sort((playerLabel1, playerLabel2) => {
        const scoreA = Number(playerLabel1.getAttribute('data-score'))
        const scoreB = Number(playerLabel2.getAttribute('data-score'))

        return scoreB - scoreA
      })

      // Přeskupení divů podle nového pořadí
      childDivs.forEach((div) => {
        parentDiv.removeChild(div)
      })

      childDivs.forEach((div) => {
        parentDiv.appendChild(div)
      })

      // Nastavení cílové pozice hráče pro interpolaci
      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y
      }

      // Aplikace zpožděných vstupů hráče (pouze pro lokálního hráče)
      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach((input) => {
          frontEndPlayers[id].target.x += input.dx
          frontEndPlayers[id].target.y += input.dy
        })
      }
    }
  }

  // Odstranění hráčů, kteří už na serveru neexistují
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if (id === socket.id) {
        document.querySelector('#usernameForm').style.display = 'block'
      }

      delete frontEndPlayers[id]
    }
  }
})

// Funkce animace hry
let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.clearRect(0, 0, platno.width, platno.height)

  // Kreslení hráčů
  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]

    if (frontEndPlayer.target) {
      // Interpolace pozice hráče
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }

    frontEndPlayer.draw()
  }

  // Kreslení projektilů
  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    frontEndProjectile.draw()
  }
}

animate()

// Objekt pro sledování stisknutých kláves
const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

// Konstantní rychlost pohybu hráče
const SPEED = 5
const playerInputs = []
let sequenceNumber = 0

// Interval pro odesílání stisknutých kláves na server
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber })
  }

  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber })
  }

  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber })
  }

  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber })
  }
}, 15)

// Sledování stisknutí kláves
window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break

    case 'KeyA':
      keys.a.pressed = true
      break

    case 'KeyS':
      keys.s.pressed = true
      break

    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

// Sledování uvolnění kláves
window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break

    case 'KeyA':
      keys.a.pressed = false
      break

    case 'KeyS':
      keys.s.pressed = false
      break

    case 'KeyD':
      keys.d.pressed = false
      break
  }
})

// Obsluha formuláře pro zadání uživatelského jména
document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    width: platno.width,
    height: platno.height,
    devicePixelRatio,
    username: document.querySelector('#usernameInput').value
  })
})
