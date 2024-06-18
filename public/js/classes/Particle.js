// Konstantní hodnota pro tření, která zpomaluje rychlost částice
const friction = 0.99

// Definice třídy Particle pro reprezentaci částice
class Particle {
  // Konstruktor inicializuje částici s danými parametry
  constructor(x, y, radius, color, velocity) {
    this.x = x  // X-ová souřadnice částice
    this.y = y  // Y-ová souřadnice částice
    this.radius = radius  // Poloměr částice
    this.color = color  // Barva částice
    this.velocity = velocity  // Rychlost částice (objekt s vlastnostmi x a y)
    this.alpha = 1  // Průhlednost částice, počáteční hodnota je 1 (plně viditelná)
  }

  // Metoda pro vykreslení částice
  draw() {
    c.save()  // Uloží aktuální stav kontextu
    c.globalAlpha = this.alpha  // Nastaví průhlednost kontextu
    c.beginPath()  // Zahájí novou cestu pro kreslení
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)  // Vykreslí kruh s danými parametry
    c.fillStyle = this.color  // Nastaví barvu výplně
    c.fill()  // Vyplní kruh
    c.restore()  // Obnoví předchozí stav kontextu
  }

  // Metoda pro aktualizaci stavu částice
  update() {
    this.draw()  // Vykreslí částici
    this.velocity.x *= friction  // Aplikuje tření na X-ovou složku rychlosti
    this.velocity.y *= friction  // Aplikuje tření na Y-ovou složku rychlosti
    this.x = this.x + this.velocity.x  // Aktualizuje X-ovou pozici částice
    this.y = this.y + this.velocity.y  // Aktualizuje Y-ovou pozici částice
    this.alpha -= 0.01  // Sníží průhlednost částice pro vytvoření efektu mizení
  }
}
