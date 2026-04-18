const PRICES = {
  garments: {
    'Kameez Shalwar': 22,
    'Full Suit': 32,
    '3 Piece Suit': 45,
    'Party Wear': 60,
    'Kurta': 18,
    'Waistcoat': 25
  },
  addons: {
    'Express Stitching': 10,
    'Lining': 5,
    'Neckline Design': 6,
    'Consultation': 5,
    'Trims & Buttons': 5,
    'Piping & Dori': 5
  }
};

function calculatePrice(items) {
  let total = 0;
  for (const item of items) {
    const base = PRICES.garments[item.garment_type] || 0;
    let addonsTotal = 0;
    if (Array.isArray(item.add_ons)) {
      for (const addon of item.add_ons) {
        addonsTotal += PRICES.addons[addon] || 0;
      }
    }
    total += base + addonsTotal;
  }
  return total;
}

module.exports = { PRICES, calculatePrice };

