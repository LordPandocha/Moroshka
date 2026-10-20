export const START_CASH = 1200;
export const PASS_START = 200;
export const DECLINE_FINE = 30;
export const CREDIT_LIMIT = 300;
export const ROUND_LIMIT = {2: 16, 3: 14, 4: 12};
export const rub = amount => `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
const up5 = amount => Math.ceil(amount / 5) * 5;
const down5 = amount => Math.floor(amount / 5) * 5;

export function priceWithDiscount(price, percent = 0) {
  return percent ? Math.ceil((price * (100 - percent)) / 100 / 10) * 10 : price;
}

export function rentFor(holding, completeGroup = false) {
  if (!holding || holding.mortgaged) return 0;
  const base = holding.business.rent * [1, 2, 4][Math.min(2, holding.level)];
  return up5(base * (completeGroup ? 1.5 : 1));
}

export function mortgageValue(business) {
  return down5(business.price / 2);
}

export function redemptionCost(business) {
  return up5(mortgageValue(business) * 1.1);
}

export function resaleValue(upgradePrice) {
  return down5(upgradePrice / 2);
}

export function availableCredit(player) {
  return Math.max(0, CREDIT_LIMIT - player.debt);
}

export function borrow(player, amount) {
  const granted = Math.min(Math.max(0, amount), availableCredit(player));
  player.debt += granted;
  player.cash += granted;
  return granted;
}

export function repay(player, amount) {
  const paid = Math.min(player.cash, player.debt, amount);
  player.cash -= paid;
  player.debt -= paid;
  return paid;
}

export function lap(player, oilIncome = 0) {
  const interest = up5(player.debt * .1);
  const income = PASS_START + oilIncome + (player.salaryBonus || 0);
  player.cash += income - interest;
  player.salaryBonus = 0;
  return {interest, income};
}

export function netWorth(player, holdings) {
  if (player.bankrupt) return 0;
  return player.cash - player.debt + holdings.reduce((sum, holding) =>
    sum + holding.business.price
      + (holding.upgradeCosts || []).reduce((total, cost) => total + cost, 0)
      - (holding.mortgaged ? mortgageValue(holding.business) : 0), 0);
}
