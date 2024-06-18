// Přidání posluchače události 'click' pro celý dokument
addEventListener('click', (event) => {
  // Vyhledání prvku <canvas> v dokumentu
  const canvas = document.querySelector('canvas')
  // Získání pozice plátna vůči viewportu
  const { top, left } = canvas.getBoundingClientRect()
  
  // Získání aktuální pozice hráče z objektu frontEndPlayers pomocí socket.id
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  }

  // Výpočet úhlu mezi pozicí hráče a pozicí kliknutí na plátno
  const angle = Math.atan2(
    event.clientY - top - playerPosition.y, // Vertikální rozdíl
    event.clientX - left - playerPosition.x // Horizontální rozdíl
  )

  // Odeslání události 'shoot' na server s aktuální pozicí hráče a vypočítaným úhlem
  socket.emit('shoot', {
    x: playerPosition.x, // X-ová pozice hráče
    y: playerPosition.y, // Y-ová pozice hráče
    angle // Vypočítaný úhel střelby
  })

  // Logování aktuálních projektilů na straně klienta (pokud je tato proměnná definována)
  console.log(frontEndProjectiles)
})
