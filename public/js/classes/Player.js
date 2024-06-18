// Definice třídy Player pro reprezentaci hráče
class Player {
  // Konstruktor inicializuje hráče s danými parametry
  constructor({ x, y, radius, color, username }) {
    this.x = x  // X-ová souřadnice hráče
    this.y = y  // Y-ová souřadnice hráče
    this.radius = radius  // Poloměr hráče
    this.color = color  // Barva hráče
    this.username = username  // Uživatelské jméno hráče
  }

  // Metoda pro vykreslení hráče
  draw() {
    // Nastaví font a barvu textu pro uživatelské jméno
    c.font = '12px sans-serif'
    c.fillStyle = 'white'
    // Vykreslí uživatelské jméno hráče vedle jeho pozice
    c.fillText(this.username, this.x - 10, this.y + 20)

    // Uloží aktuální stav kontextu
    c.save()
    // Nastaví barvu a velikost stínu pro efekt kolem hráče
    c.shadowColor = this.color
    c.shadowBlur = 20

    // Zahájí novou cestu pro kreslení
    c.beginPath()
    // Vykreslí kruh představující hráče s danými parametry
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    // Nastaví barvu výplně pro hráče
    c.fillStyle = this.color
    // Vyplní kruh
    c.fill()

    // Obnoví předchozí stav kontextu
    c.restore()
  }
}
