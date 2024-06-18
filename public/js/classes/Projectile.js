// Definice třídy Projectile pro reprezentaci střely
class Projectile {
  // Konstruktor inicializuje střelu s danými parametry
  constructor({ x, y, radius, color = 'white', velocity }) {
    this.x = x  // X-ová souřadnice střely
    this.y = y  // Y-ová souřadnice střely
    this.radius = radius  // Poloměr střely
    this.color = color  // Barva střely, výchozí je bílá
    this.velocity = velocity  // Rychlost střely (objekt s vlastnostmi x a y)
  }

  // Metoda pro vykreslení střely
  draw() {
    c.save()  // Uloží aktuální stav kontextu
    c.shadowColor = this.color  // Nastaví barvu stínu pro efekt kolem střely
    c.shadowBlur = 20  // Nastaví rozmazání stínu
    c.beginPath()  // Zahájí novou cestu pro kreslení
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)  // Vykreslí kruh představující střelu
    c.fillStyle = this.color  // Nastaví barvu výplně
    c.fill()  // Vyplní kruh
    c.restore()  // Obnoví předchozí stav kontextu
  }

  // Metoda pro aktualizaci stavu střely
  update() {
    this.draw()  // Vykreslí střelu
    this.x = this.x + this.velocity.x  // Aktualizuje X-ovou pozici střely podle její rychlosti
    this.y = this.y + this.velocity.y  // Aktualizuje Y-ovou pozici střely podle její rychlosti
  }
}
