const isForeignMarket = (market, ticker) =>
  market === "NASDAQ" ||
  market === "NYSE" ||
  (ticker && (ticker.includes(":") || ticker.startsWith("AUTO")));

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
  liveStockPrices,
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
      역사적내역: {},
    };
  });

  const trackingHoldings = {};
  stockMaster.forEach((stock) => {
    trackingHoldings[stock.종목명] = {
      qty: 0,
      totalCostUsd: 0,
      totalCostKrw: 0,
    };
  });

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

        const txTotalKrw =
          tx.구분 === "매수"
            ? isForeign
              ? (tx.수량 * tx.단가 + tx.수수료 + tx.세금) * exchangeRate
              : tx.수량 * tx.단가 + tx.수수료 + tx.세금
            : isForeign
              ? (tx.수량 * tx.단가 - tx.수수료 - tx.세금) * exchangeRate
              : tx.수량 * tx.단가 - tx.수수료 - tx.세금;

        if (tx.구분 === "매수") {
          tracking.qty += tx.수량;
          if (isForeign) {
            tracking.totalCostUsd += tx.수량 * tx.단가 + tx.수수료 + tx.세금;
          }
          tracking.totalCostKrw += txTotalKrw;
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

      if (tracking.qty > 0) {
        const avgPrice = isForeign
          ? tracking.totalCostUsd / tracking.qty
          : tracking.totalCostKrw / tracking.qty;
        const livePrice = liveStockPrices[matrix[name].티커] || avgPrice;
        const livePriceKrw = isForeign ? livePrice * exchangeRate : livePrice;
        const dailyCostKrw = tracking.totalCostKrw;
        const dailyEvalKrw = tracking.qty * livePriceKrw;
        const dailyProfitKrw = dailyEvalKrw - dailyCostKrw;

        matrix[name].역사적내역[date] = {
          qty: tracking.qty,
          avgPrice,
          totalCost: dailyCostKrw,
          profit: dailyProfitKrw,
          rate: dailyCostKrw > 0 ? (dailyProfitKrw / dailyCostKrw) * 100 : 0,
        };
      }
    });
  });

  const activeHoldingNames = holdingList.map((holding) => holding.종목명);
  const finalRows = Object.values(matrix).filter(
    (row) =>
      activeHoldingNames.includes(row.종목명) &&
      filteredDates.some((date) => row.역사적내역[date] !== undefined),
  );

  const dailyColumnTotals = {};
  filteredDates.forEach((date) => {
    let sumProfit = 0;
    let sumCost = 0;

    finalRows.forEach((row) => {
      const snapshot = row.역사적내역[date];
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

  return { finalRows, filteredDates, dailyColumnTotals };
};

export const buildActiveHoldingQuantities = (holdingList) => {
  const quantities = {};
  holdingList.forEach((holding) => {
    quantities[holding.종목명] = holding.보유량;
  });
  return quantities;
};
