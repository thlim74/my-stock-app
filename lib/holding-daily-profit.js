const toNumber = (value) => Number(value) || 0;

const isSameHolding = (transaction, holding) =>
  String(transaction?.티커 || "") === String(holding?.ticker || "") ||
  String(transaction?.종목명 || "") === String(holding?.name || "");

const isTodayTransaction = (transaction, today) =>
  String(transaction?.날짜 || "").slice(0, 10) === today;

// Separates shares bought today from shares already held at yesterday's close.
// A new purchase must be measured from its own trade price, not from yesterday's
// close, otherwise a same-day buy is incorrectly shown as a large day loss/gain.
export const calculateHoldingDailyProfit = ({
  holding,
  transactions = [],
  today,
  referenceClose,
}) => {
  const currentQty = toNumber(holding?.quantity ?? holding?.qty);
  const currentPrice = toNumber(holding?.currentPrice);
  const todays = transactions.filter(
    (transaction) => isSameHolding(transaction, holding) && isTodayTransaction(transaction, today),
  );
  const buys = todays.filter((transaction) => transaction?.구분 === "매수");
  const buyQty = buys.reduce((sum, transaction) => sum + toNumber(transaction?.수량), 0);
  const sellQty = todays
    .filter((transaction) => transaction?.구분 === "매도")
    .reduce((sum, transaction) => sum + toNumber(transaction?.수량), 0);
  const buyCost = buys.reduce(
    (sum, transaction) => sum + toNumber(transaction?.수량) * toNumber(transaction?.단가),
    0,
  );
  const averageBuyPrice = buyQty > 0 ? buyCost / buyQty : 0;

  const startQty = Math.max(0, currentQty - buyQty + sellQty);
  const existingQtyAfterSales = Math.max(0, startQty - sellQty);
  const todayBuyQtyHeld = Math.min(buyQty, Math.max(0, currentQty - existingQtyAfterSales));
  const existingQtyHeld = Math.max(0, currentQty - todayBuyQtyHeld);
  const close = Number(referenceClose);
  const hasClose = Number.isFinite(close) && close > 0;

  if ((existingQtyHeld > 0 && !hasClose) || currentPrice <= 0) return null;

  const baseValue = existingQtyHeld * close + todayBuyQtyHeld * averageBuyPrice;
  if (baseValue <= 0) return null;

  return {
    profit:
      existingQtyHeld * (currentPrice - close) +
      todayBuyQtyHeld * (currentPrice - averageBuyPrice),
    rate: ((currentPrice * currentQty - baseValue) / baseValue) * 100,
  };
};
