import { isForeignMarket } from "@/lib/market-utils";

const parseCleanNum = (value) => {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
};

const resolveMasterMatch = (stockMaster, ticker, name) =>
  stockMaster.find((stock) => stock.티커 === ticker || stock.종목명 === name);

const buildSignedCashFlow = (cash) => {
  const amount = parseCleanNum(cash.금액);
  return cash.구분 === "입금" ? amount : -amount;
};

export const buildPortfolioStats = ({
  transactions,
  cashFlows,
  exchangeRate,
  liveStockPrices,
  dailyPriceHistoryMap = {},
  stockMaster,
  today,
  cashAdjustment = 0,
}) => {
  let netInvestment = 0;
  let baseCashBalance = 0;

  cashFlows.forEach((cash) => {
    const signed = buildSignedCashFlow(cash);
    netInvestment += signed;
    baseCashBalance += signed;
  });

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.날짜) - new Date(b.날짜),
  );

  const holdingMap = {};
  let totalRealizedProfit = 0;
  let runningCashFromTrades = baseCashBalance;

  sortedTransactions.forEach((tx) => {
    const name = tx.종목명;
    const quantity = Number(tx.수량) || 0;
    const price = Number(tx.단가) || 0;
    const fee = Number(tx.수수료) || 0;
    const tax = Number(tx.세금) || 0;

    const masterMatch = resolveMasterMatch(stockMaster, tx.티커, name);
    const market = masterMatch ? masterMatch.시장 : "KOSPI";
    const isForeign = isForeignMarket(market, tx.티커);
    const tradePrincipalKrw = isForeign
      ? quantity * price * exchangeRate
      : quantity * price;
    const feeTaxKrw = isForeign ? (fee + tax) * exchangeRate : fee + tax;
    const buyCashOutKrw = tradePrincipalKrw + feeTaxKrw;
    const sellCashInKrw = tradePrincipalKrw - feeTaxKrw;
    const targetTicker =
      tx.티커 || (masterMatch ? masterMatch.티커 : `AUTO_${Date.now()}`);

    if (!holdingMap[name]) {
      holdingMap[name] = {
        종목명: name,
        티커: targetTicker,
        시장: market,
        보유수량: 0,
        총매수금액원화: 0,
        총매수금액달러: 0,
        최근단가: price,
      };
    }

    const holding = holdingMap[name];
    holding.시장 = market;

    if (tx.구분 === "매수") {
      runningCashFromTrades -= buyCashOutKrw;
      holding.보유수량 += quantity;
      holding.총매수금액원화 += tradePrincipalKrw;
      if (isForeign) {
        holding.총매수금액달러 += quantity * price;
      }
    } else {
      runningCashFromTrades += sellCashInKrw;
      const avgPriceKrw =
        holding.보유수량 > 0 ? holding.총매수금액원화 / holding.보유수량 : 0;
      const realizedKrw = sellCashInKrw - quantity * avgPriceKrw;
      totalRealizedProfit += realizedKrw;

      if (isForeign) {
        const avgPriceUsd =
          holding.보유수량 > 0 ? holding.총매수금액달러 / holding.보유수량 : 0;
        holding.총매수금액달러 -= quantity * avgPriceUsd;
      }

      holding.총매수금액원화 -= quantity * avgPriceKrw;
      holding.보유수량 -= quantity;
    }

    holding.최근단가 = price;
  });

  const sectorWeightsMap = {};

  const holdingList = Object.values(holdingMap)
    .filter((holding) => holding.보유수량 > 0)
    .map((holding) => {
      const isForeign = isForeignMarket(holding.시장, holding.티커);
      const currentPrice =
        liveStockPrices[holding.티커] !== undefined
          ? liveStockPrices[holding.티커]
          : holding.최근단가;

      const evaluationAmount = isForeign
        ? holding.보유수량 * currentPrice * exchangeRate
        : holding.보유수량 * currentPrice;
      const profitKrw = evaluationAmount - holding.총매수금액원화;

      const masterMatch = resolveMasterMatch(
        stockMaster,
        holding.티커,
        holding.종목명,
      );
      const sectorName = masterMatch ? masterMatch.섹터 : "일반제조/서비스";
      sectorWeightsMap[sectorName] =
        (sectorWeightsMap[sectorName] || 0) + evaluationAmount;

      return {
        종목명: holding.종목명,
        티커: holding.티커,
        시장: holding.시장,
        보유수량: holding.보유수량,
        섹터: sectorName,
        순투자원금: Math.round(holding.총매수금액원화),
        총매수금액: Math.round(holding.총매수금액원화),
        평균단가:
          holding.보유수량 > 0
            ? holding.총매수금액원화 / holding.보유수량
            : 0,
        평균단가달러기준:
          holding.보유수량 > 0
            ? holding.총매수금액달러 / holding.보유수량
            : 0,
        현재가: currentPrice,
        평가금액: Math.round(evaluationAmount),
        손익: Math.round(profitKrw),
        수익률:
          holding.총매수금액원화 > 0
            ? `${((profitKrw / holding.총매수금액원화) * 100).toFixed(2)}%`
            : "0.00%",
      };
    });

  const totalEvaluation = holdingList.reduce(
    (sum, holding) => sum + holding.평가금액,
    0,
  );
  const cashBalance = runningCashFromTrades + cashAdjustment;
  const totalAsset = totalEvaluation + cashBalance;
  const totalProfitAmount = totalAsset - netInvestment;
  const totalProfitRate =
    netInvestment > 0 ? (totalProfitAmount / netInvestment) * 100 : 0;

  const rawDates = Array.from(
    new Set([
      ...transactions.map((tx) => tx.날짜),
      ...cashFlows.map((cash) => cash.날짜),
      "2020-01-01",
      today,
    ]),
  ).sort((a, b) => new Date(a) - new Date(b));

  const dailyList = [];
  let assetChangeDoD = 0;
  let assetChangeRateDoD = 0;

  if (rawDates.length > 0) {
    const firstDate = new Date(rawDates[0]);
    const lastDate = new Date(today);
    const allDatesArray = [];
    const currentLoopDate = new Date(firstDate);

    while (currentLoopDate <= lastDate) {
      allDatesArray.push(currentLoopDate.toISOString().split("T")[0]);
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    let runningInvestment = 0;
    let runningCash = 0;
    const runningHoldings = {};
    let previousAsset = 0;

    allDatesArray.forEach((date) => {
      let dayExternalCashFlow = 0;
      let dayTradeCashFlow = 0;

      cashFlows
        .filter((cash) => cash.날짜 === date)
        .forEach((cash) => {
          const signed = buildSignedCashFlow(cash);
          runningInvestment += signed;
          runningCash += signed;
          dayExternalCashFlow += signed;
        });

      transactions
        .filter((tx) => tx.날짜 === date)
        .forEach((tx) => {
          const name = tx.종목명;
          const quantity = Number(tx.수량) || 0;
          const price = Number(tx.단가) || 0;
          const fee = Number(tx.수수료) || 0;
          const tax = Number(tx.세금) || 0;

          const masterMatch = resolveMasterMatch(stockMaster, tx.티커, name);
          const market = masterMatch ? masterMatch.시장 : "KOSPI";
          const isForeign = isForeignMarket(market, tx.티커);

          const tradePrincipalKrw = isForeign
            ? quantity * price * exchangeRate
            : quantity * price;
          const feeTaxKrw = isForeign ? (fee + tax) * exchangeRate : fee + tax;
          const buyCashOutKrw = tradePrincipalKrw + feeTaxKrw;
          const sellCashInKrw = tradePrincipalKrw - feeTaxKrw;

          if (!runningHoldings[name]) {
            runningHoldings[name] = {
              qty: 0,
              totalCostKrw: 0,
              currentPrice: price,
              isForeign,
              ticker: tx.티커,
            };
          }

          if (tx.구분 === "매수") {
            runningCash -= buyCashOutKrw;
            dayTradeCashFlow -= buyCashOutKrw;
            runningHoldings[name].qty += quantity;
            runningHoldings[name].totalCostKrw += tradePrincipalKrw;
          } else {
            runningCash += sellCashInKrw;
            dayTradeCashFlow += sellCashInKrw;
            const avgKrw =
              runningHoldings[name].qty > 0
                ? runningHoldings[name].totalCostKrw / runningHoldings[name].qty
                : 0;
            runningHoldings[name].totalCostKrw -= quantity * avgKrw;
            runningHoldings[name].qty -= quantity;
          }

          runningHoldings[name].currentPrice = price;
        });

      let dayEvaluation = 0;
      Object.values(runningHoldings).forEach((holding) => {
        if (holding.qty > 0) {
          const historyByDate = dailyPriceHistoryMap[holding.ticker] || {};
          const historicalPrice = historyByDate[date];
          const dynamicPrice =
            date === today
              ? liveStockPrices[holding.ticker] || historicalPrice || holding.currentPrice
              : historicalPrice || holding.currentPrice;
          dayEvaluation += holding.isForeign
            ? holding.qty * dynamicPrice * exchangeRate
            : holding.qty * dynamicPrice;
        }
      });

      const adjustedRunningCash =
        date === today ? runningCash + cashAdjustment : runningCash;
      const dayAsset = dayEvaluation + adjustedRunningCash;
      const totalCashFlow = dayExternalCashFlow + dayTradeCashFlow;
      const evaluationProfit = dayAsset - runningInvestment;
      const dayProfit =
        dailyList.length === 0
          ? evaluationProfit
          : dayAsset - previousAsset + dayExternalCashFlow;
      const dayProfitRate =
        previousAsset > 0 ? (dayProfit / previousAsset) * 100 : 0;

      dailyList.push({
        기준일: date,
        평가금액: Math.round(dayAsset),
        당일현금흐름: Math.round(totalCashFlow),
        일간손익: Math.round(dayProfit),
        일간수익률: `${dayProfitRate.toFixed(2)}%`,
        수익률:
          runningInvestment > 0
            ? `${((evaluationProfit / runningInvestment) * 100).toFixed(2)}%`
            : "0.00%",
        평가손익: Math.round(evaluationProfit),
        순투자원금: Math.round(runningInvestment),
      });

      previousAsset = dayAsset;
    });

    if (dailyList.length >= 2) {
      const todaySnapshot = dailyList[dailyList.length - 1];
      const yesterdaySnapshot = dailyList[dailyList.length - 2];
      assetChangeDoD = todaySnapshot.평가금액 - yesterdaySnapshot.평가금액;
      assetChangeRateDoD =
        yesterdaySnapshot.평가금액 > 0
          ? (assetChangeDoD / yesterdaySnapshot.평가금액) * 100
          : 0;
    }
  }

  const monthlyMap = {};
  dailyList.forEach((daily) => {
    const monthKey = daily.기준일.slice(0, 7);

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        월별: monthKey,
        순투자원금: daily.순투자원금,
        월말평가금액: daily.평가금액,
        월간현금흐름: 0,
        월간손익: 0,
        월간수익률: daily.수익률,
        평가손익: daily.평가손익,
      };
    }

    monthlyMap[monthKey].순투자원금 = daily.순투자원금;
    monthlyMap[monthKey].월말평가금액 = daily.평가금액;
    monthlyMap[monthKey].월간현금흐름 += daily.당일현금흐름;
    monthlyMap[monthKey].월간손익 += daily.일간손익;
    monthlyMap[monthKey].월간수익률 = daily.수익률;
    monthlyMap[monthKey].평가손익 = daily.평가손익;
  });

  const monthlyList = Object.values(monthlyMap).sort((a, b) =>
    b.월별.localeCompare(a.월별),
  );

  const sectorWeights = Object.keys(sectorWeightsMap)
    .map((sectorName) => {
      const amount = sectorWeightsMap[sectorName];
      return {
        name: sectorName,
        amount,
        percentage:
          totalEvaluation > 0 ? ((amount / totalEvaluation) * 100).toFixed(1) : "0.0",
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    holdingList,
    netInvestment,
    totalAsset,
    totalRealizedProfit,
    totalEvaluation,
    totalProfitAmount,
    totalProfitRate,
    cashBalance,
    baseCashBalance: runningCashFromTrades,
    cashAdjustment,
    dailyList,
    monthlyList,
    allDates: dailyList.map((daily) => daily.기준일),
    assetChangeDoD,
    assetChangeRateDoD,
    sectorWeights,
  };
};
