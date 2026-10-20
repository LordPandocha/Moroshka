export const START_CASH = 1200;
export const PASS_START = 200;
export const DECLINE_FINE = 30;
export const ROUND_LIMIT = {2:16, 3:14, 4:12};
export const rub = amount => `${Math.round(amount).toLocaleString('ru-RU')} ₽`;

export function priceWithDiscount(price, percent = 0) {
  return percent ? Math.ceil(price * (100 - percent) / 100 / 10) * 10 : price;
}

export function rentFor(business, level = 0) {
  return business.rent * [1, 2, 4][Math.min(2, Math.max(0, level))];
}

export function transfer(payer, amount, payee = null) {
  const fromCash = Math.min(payer.cash, amount);
  payer.cash -= fromCash;
  payer.debt += amount - fromCash;
  if (payee) payee.cash += amount;
  return {fromCash, borrowed: amount - fromCash};
}

export function receive(player, amount) {
  player.cash += amount;
}

export function repay(player, amount) {
  const paid = Math.min(player.cash, player.debt, amount);
  player.cash -= paid;
  player.debt -= paid;
  return paid;
}

export function lap(player, oilIncome = 0) {
  const interest = Math.ceil(player.debt * .1 / 10) * 10;
  player.debt += interest;
  const income = PASS_START + oilIncome + (player.salaryBonus || 0);
  player.cash += income;
  player.salaryBonus = 0;
  return {interest, income};
}

export function netWorth(player, holdings) {
  return player.cash - player.debt + holdings.reduce((sum, holding) =>
    sum + holding.business.price + holding.level * holding.business.upgrade, 0);
}
