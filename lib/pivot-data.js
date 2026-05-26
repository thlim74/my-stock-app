import { isForeignMarket } from "@/lib/market-utils";

const filterPivotDates = (allDates, appliedFilter) => {
  const baseDatesSorted = [...allDates].sort((a, b) => b.localeCompare(a));

  if (!appliedFilter.start && !appliedFilter.end) {
    return baseDatesSorted.slice(0, 6);
  }

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
  dailyPriceHistoryMap = {},
  exchangeRate,
  appliedFilter,
}) => {
  const filteredDates = filterPivotDates(allDates, appliedFilter);
  const sortedTransactions = [...transactions].sort((a, b) =>
    a.날짜.localeCompare(b.날짜),
  );

  const matrix = {};
  stockMaster.forEach((stock) => {
    matrix[stock.종목명] = {
      종목명: stock.종목명,
      티커: stock.티커,
      시장: stock.시장,
      일자별손익: {},
    };
  });

  const trackingHoldings = {};
  stockMaster.forEach((stock) => {
    trackingHoldings[stock.종목명] = {
      qty: 0,
      totalCostUsd: 0,
      totalCostKrw: 0,
      lastValuationPrice: 0,
    };
  });

  const tradingDateSet = new Set();

  allDates.forEach((date) => {
    sortedTransactions
      .filter((tx) => tx.날짜 === date)
      .forEach((tx) => {
        const tracking = trackingHoldings[tx.종목명];
        if (!tracking) return;

        const masterMatch = stockMaster.find(
          (stock) => stock.티커 === tx.티커 || stock.종목명 === tx.종목명,
        );
        const activeMarket = masterMatch ? masterMatch.시장 : "KOSPI";
        const isForeign = isForeignMarket(activeMarket, tx.티커);

        if (tx.구분 === "매수") {
          tracking.qty += tx.수량;
          if (isForeign) {
            tracking.totalCostUsd += tx.수량 * tx.단가;
          }
          tracking.totalCostKrw +=
            isForeign ? tx.수량 * tx.단가 * exchangeRate : tx.수량 * tx.단가;
        } else {
          const avgUsd = tracking.qty > 0 ? tracking.totalCostUsd / tracking.qty : 0;
          const avgKrw = tracking.qty > 0 ? tracking.totalCostKrw / tracking.qty : 0;
          tracking.totalCostUsd -= tx.수량 * avgUsd;
          tracking.totalCostKrw -= tx.수량 * avgKrw;
          tracking.qty -= tx.수량;
        }
      });

    Object.keys(trackingHoldings).forEach((name) => {
      if (!matrix[name]) return;

      const tracking = trackingHoldings[name];
      const masterMatch = stockMaster.find((stock) => stock.종목명 === name);
      const activeMarket = masterMatch ? masterMatch.시장 : "KOSPI";
      const isForeign = isForeignMarket(activeMarket, matrix[name].티커);
      const ticker = matrix[name].티커;
      const historyByDate = dailyPriceHistoryMap[ticker] || {};
      const historicalPrice = historyByDate[date];

      if (tracking.qty > 0) {
        const avgPrice = isForeign
          ? tracking.totalCostUsd / tracking.qty
          : tracking.totalCostKrw / tracking.qty;
        const fallbackPrice = tracking.lastValuationPrice || avgPrice;
        const valuationPrice = Number.isFinite(historicalPrice)
          ? historicalPrice
          : fallbackPrice;
        tracking.lastValuationPrice = valuationPrice;

        if (Number.isFinite(historicalPrice)) {
          tradingDateSet.add(date);
        }

        const valuationPriceKrw = isForeign ? valuationPrice * exchangeRate : valuationPrice;
        const totalCost = tracking.totalCostKrw;
        const dailyEvalKrw = tracking.qty * valuationPriceKrw;
        const dailyProfitKrw = dailyEvalKrw - totalCost;

        matrix[name].일자별손익[date] = {
          qty: tracking.qty,
          avgPrice,
          totalCost,
          profit: dailyProfitKrw,
          rate: totalCost > 0 ? (dailyProfitKrw / totalCost) * 100 : 0,
        };
      }
    });
  });

  const latestTradingDates = [...tradingDateSet]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 5);
  const filteredTradingDates = latestTradingDates;
  const activeHoldingNames = holdingList.map((holding) => holding.종목명);
  const finalRows = Object.values(matrix).filter(
    (row) =>
      activeHoldingNames.includes(row.종목명) &&
      filteredTradingDates.some((date) => row.일자별손익?.[date] !== undefined),
  );

  const dailyColumnTotals = {};
  filteredTradingDates.forEach((date) => {
    let sumProfit = 0;
    let sumCost = 0;

    finalRows.forEach((row) => {
      const snapshot = row.일자별손익?.[date];
      if (snapshot) {
        sumProfit += snapshot.profit;
        sumCost += snapshot.totalCost;
      }
    });

    dailyColumnTotals[date] = {
      profit: sumProfit,
      rate: sumCost > 0 ? (sumProfit / sumCost) * 100 : 0,
    };
  });

  return { finalRows, filteredDates: filteredTradingDates, dailyColumnTotals };
};

export const buildActiveHoldingQuantities = (holdingList) => {
  const quantities = {};
  holdingList.forEach((holding) => {
    quantities[holding.종목명] = holding.보유수량;
  });
  return quantities;
};
