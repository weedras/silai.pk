function parseOrderItem(item) {
  if (!item) return item;
  if (typeof item.add_ons === 'string') {
    try { item.add_ons = JSON.parse(item.add_ons); } catch (e) { item.add_ons = []; }
  }
  return item;
}

module.exports = { parseOrderItem };
