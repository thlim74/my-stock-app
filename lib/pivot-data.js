import { isForeignMarket } from "@/lib/market-utils";

const toNumber = (value) => Number(value) || 0;

const findFirst = (obj, keys, fallback = undefined) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) {
      return obj[key];
    }
  }
  return fallback;
};

const txView = (tx) => ({
  date: String(findFirst(tx, ["날짜"], "")),
  kind: String(findFirst(tx, ["구분"], "")),
  name: String(findFirst(tx, ["종목명"], "")),
  ticker: String(findFirst(tx, ["티커"], "")),
  qty: toNumber(findFirst(tx, ["수량"], 0)),
  price: toNumber(findFirst(tx, ["단가"], 0)),
  fee: toNumber(findFirst(tx, ["수수료"], 0)),
  tax: toNumber(findFirst(tx, ["세금"], 0)),
});

const stockView = (stock) => ({
  name: String(findFirst(stock, ["종목명"], "")),
  ticker: String(findFirst(stock, ["티커"], "")),
  market: String(findFirst(stock, ["시장"], "KOSPI")),
});

const holdingView = (holding) => ({
  name: String(findFirst(holding, ["종목명"], "")),
  qty: toNumber(findFirst(holding, ["보유수량"], 0)),
});

const filterPivotDates = (allDates, appliedFilter) => {
  const baseDatesSorted = [...allDates].sort((a, b) => b.localeCompare(a));
  if (!appliedFilter.start && !appliedFilter.end) return baseDatesSorted.slice(0, 6);

  return baseDatesSorted.filter((date) => {
    const condStart = appliedFilter.start ? date >= appliedFilter.start : true;
    const condEnd = appliedFilter.end ? date <= appliedFilter.end : true;
    return condStart && condEnd;
  });
};

export const buildPivotData = ({
  allDates,
  holdingList,
  transactions,
  stockMaster,
  liveStockPrices = {},
  dailyPriceHistoryMap = {},
  exchangeRate,
  appliedFilter,
  today,
}) => {
  const filteredDates = filterPivotDates(allDates, appliedFilter);
  const txs = [...transactions].map(txView).sort((a, b) => a.date.localeCompare(b.date));
  const masters = stockMaster.map(stockView).filter((s) => s.name && s.ticker);

  const matrix = {};
  const tracking = {};

  masters.forEach((s) => {
    matrix[s.name] = { name: s.name, ticker: s.ticker, market: s.market, byDate: {} };
    tracking[s.name] = { qty: 0, totalCostKrw: 0, totalCostUsd: 0, lastValuationPrice: 0 };
  });

  const tradingDateSet = new Set();

  allDates.forEach((date) => {
    txs
      .filter((tx) => tx.date === date)
      .forEach((tx) => {
        if (!tracking[tx.name]) return;

        const master = masters.find((m) => m.ticker === tx.ticker || m.name === tx.name);
        const market = master?.market || "KOSPI";
        const isForeign = isForeignMarket(market, tx.ticker);

        const principalKrw = isForeign ? tx.qty * tx.price * exchangeRate : tx.qty * tx.price;

        const track = tracking[tx.name];
        if (tx.kind === "매수") {
          track.qty += tx.qty;
          track.totalCostKrw += principalKrw;
          if (isForeign) track.totalCostUsd += tx.qty * tx.price;
        } else {
          const avgKrw = track.qty > 0 ? track.totalCostKrw / track.qty : 0;
          const avgUsd = track.qty > 0 ? track.totalCostUsd / track.qty : 0;
          track.totalCostKrw -= tx.qty * avgKrw;
          track.totalCostUsd -= tx.qty * avgUsd;
          track.qty -= tx.qty;
        }
      });

    Object.keys(tracking).forEach((name) => {
      const row = matrix[name];
      if (!row) return;

      const track = tracking[name];
      if (track.qty <= 0) return;

      const isForeign = isForeignMarket(row.market, row.ticker);
      const historyByDate = dailyPriceHistoryMap[row.ticker] || {};
      const historicalPrice = historyByDate[date];
      const isToday = today && date === today;
      const liveTodayPrice = Number(liveStockPrices[row.ticker]);
      const avgPrice = isForeign ? track.totalCostUsd / track.qty : track.totalCostKrw / track.qty;
      const fallbackPrice = track.lastValuationPrice || avgPrice;
      const valuationPrice =
        isToday && Number.isFinite(liveTodayPrice)
          ? liveTodayPrice
          : Number.isFinite(historicalPrice)
            ? historicalPrice
            : fallbackPrice;

      track.lastValuationPrice = valuationPrice;
      if (Number.isFinite(historicalPrice) || isToday) tradingDateSet.add(date);

      const valuationPriceKrw = isForeign ? valuationPrice * exchangeRate : valuationPrice;
      const evalAmount = track.qty * valuationPriceKrw;
      const totalCost = track.totalCostKrw;
      const cumulativeProfit = evalAmount - totalCost;

      row.byDate[date] = {
        qty: track.qty,
        avgPrice,
        totalCost,
        evalAmount,
        profit: cumulativeProfit,
        rate: totalCost > 0 ? (cumulativeProfit / totalCost) * 100 : 0,
      };
    });
  });

  const filteredTradingDates = [...tradingDateSet]
    .filter((date) => filteredDates.includes(date))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 5);

  const activeHoldingNames = new Set(
    (holdingList || []).map(holdingView).filter((h) => h.qty > 0).map((h) => h.name),
  );

  const finalRows = Object.values(matrix).filter(
    (row) => activeHoldingNames.has(row.name) && filteredTradingDates.some((date) => row.byDate[date]),
  );

  // Convert to day-over-day profit to match daily return concept.
  finalRows.forEach((row) => {
    const ascDates = Object.keys(row.byDate).sort((a, b) => a.localeCompare(b));
    let prevEval = null;
    let prevQty = 0;

    ascDates.forEach((date) => {
      const snapshot = row.byDate[date];
      const evalAmount = Number(snapshot.evalAmount) || 0;
      const qty = Number(snapshot.qty) || 0;
      const currentPriceKrw = qty > 0 ? evalAmount / qty : 0;
      let baseEval = 0;
      let dayProfit = 0;

      if (prevEval !== null && qty > 0 && prevQty > 0) {
        const prevPriceKrw = prevEval / prevQty;
        baseEval = qty * prevPriceKrw;
        dayProfit = qty * (currentPriceKrw - prevPriceKrw);
      }

      if (date === today) {
        const historyByDate = dailyPriceHistoryMap[row.ticker] || {};
        const prevDates = Object.keys(historyByDate)
          .filter((d) => d < today)
          .sort((a, b) => b.localeCompare(a));
        const prevCloseRaw =
          prevDates.length > 0 ? Number(historyByDate[prevDates[0]]) : NaN;
        const qty = Number(snapshot.qty) || 0;
        if (qty > 0 && Number.isFinite(prevCloseRaw) && prevCloseRaw > 0) {
          const currentPriceRaw = evalAmount / qty;
          const isForeign = isForeignMarket(row.market, row.ticker);
          const prevCloseKrw = isForeign ? prevCloseRaw * exchangeRate : prevCloseRaw;
          baseEval = qty * prevCloseKrw;
          dayProfit = qty * (currentPriceRaw - prevCloseKrw);
        }
      }
      snapshot.baseEval = baseEval;
      snapshot.profit = dayProfit;
      snapshot.rate = snapshot.baseEval > 0 ? (dayProfit / snapshot.baseEval) * 100 : 0;
      prevEval = evalAmount;
      prevQty = qty;
    });
  });

  const dailyColumnTotals = {};
  filteredTradingDates.forEach((date) => {
    let sumProfit = 0;
    let sumBaseEval = 0;

    finalRows.forEach((row) => {
      const snapshot = row.byDate[date];
      if (!snapshot) return;
      sumProfit += Number(snapshot.profit) || 0;
      sumBaseEval += Number(snapshot.baseEval) || 0;
    });

    dailyColumnTotals[date] = {
      profit: sumProfit,
      rate: sumBaseEval > 0 ? (sumProfit / sumBaseEval) * 100 : 0,
    };
  });

  return { finalRows, filteredDates: filteredTradingDates, dailyColumnTotals };
};

export const buildActiveHoldingQuantities = (holdingList) => {
  const quantities = {};
  (holdingList || []).map(holdingView).forEach((holding) => {
    quantities[holding.name] = holding.qty;
  });
  return quantities;
};
