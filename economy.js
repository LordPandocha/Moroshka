export const START_CASH = 1500;
export const LAP_SALARY = 200;
export const ROUNDS = 8;
export const rub = value => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
export function discounted(price, percent = 0) {
  return Math.max(0, Math.ceil(price * (100 - percent) / 100 / 10) * 10);
}
export function rentFor(tile, level = 0) {
  return tile.rent * [1, 2, 4][Math.min(2, level)];
}
export function netWorth(player, tiles) {
  return player.cash + player.owned.reduce((sum, index) => {
    const tile = tiles[index];
    return sum + tile.price + (player.levels[index] || 0) * tile.upgrade;
  }, 0);
}
export function pay(player, amount) {
  const paid = Math.min(player.cash, amount);
  player.cash -= paid;
  return {paid, shortfall: amount - paid};
}
