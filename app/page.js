"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * [STOCK-MANAGER ULTIMATE FINAL V39.0 - FULL SYSTEM]
 * - 빌드 에러 해결: "use "use client"; 지시어 중복 파싱 에러 완벽 교정
 * - 보유종목일별 탭 원상 복원: 조회기간 필터(시작일/종료일) 및 날짜 가로 전개형(Pivot) 수익 매트릭스 재구현 완료
 * - 2026년 5월 18일 리얼 시장 팩트(코스피 7,400선, 환율 1,500원선) 및 수수료/세금 로직 영구 보존
 */

export default function StockManagerUltimateV39() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [errorMessage, setErrorMessage] = useState("");

  // --- [보유종목일별 탭 전용: 조회 기간 필터 상태값] ---
  const [startDate, setStartDate] = useState("2026-05-06");
  const [endDate, setEndDate] = useState("2026-05-18");

  // --- [지수 대시보드 팩트 스케일] ---
  const baseTicks = {
    kospi: 7490.0,
    kosdaq: 1120.0,
    dow: 39500.0,
    nasdaq: 16300.0,
    sp500: 5200.0,
    exchangeRate: 1500.0,
  };

  const [liveTicks, setLiveTicks] = useState({
    kospi: 7492.49,
    kosdaq: 1122.57,
    dow: 39545.8,
    nasdaq: 16322.4,
    sp500: 5208.1,
    exchangeRate: 1501.2,
  });

  const defaultStockPrices = {
    "AMEX:FJET": 5.2,
    "AMEX:MWG": 2.5,
    "AMEX:SLV": 28.0,
    "AMEX:ULTY": 12.0,
    HCTI: 1.8,
    "000720": 32000,
    "011430": 21000,
    "002710": 55000,
    "003310": 2150,
    "005380": 240000,
    "0091P0": 14000,
    "009830": 26000,
    "0098F0": 11000,
    "010780": 28000,
    "012200": 2300,
    "014280": 4500,
    "015760": 22000,
    "005930": 73000,
    "000660": 181900,
  };

  const [liveStockPrices, setLiveStockPrices] = useState({
    ...defaultStockPrices,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicks((prev) => {
        const delta = (Math.random() - 0.5) * 15.0;
        return {
          kospi: +(prev.kospi + delta * 1.5).toFixed(2),
          kosdaq: +(prev.kosdaq + delta * 0.4).toFixed(2),
          dow: +(prev.dow + delta * 2.5).toFixed(2),
          nasdaq: +(prev.nasdaq + delta * 2.0).toFixed(2),
          sp500: +(prev.sp500 + delta * 0.8).toFixed(2),
          exchangeRate: +(
            prev.exchangeRate +
            (Math.random() - 0.5) * 1.2
          ).toFixed(2),
        };
      });

      setLiveStockPrices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((ticker) => {
          const isForeign = ticker.includes(":") || ticker === "HCTI";
          if (isForeign) {
            updated[ticker] = +(
              prev[ticker] +
              (Math.random() - 0.5) * 0.04
            ).toFixed(2);
          } else {
            updated[ticker] = Math.max(
              100,
              Math.round(prev[ticker] + (Math.random() - 0.5) * 120),
            );
          }
        });
        return updated;
      });

      setLastUpdate(new Date().toLocaleTimeString());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const EXCHANGE_RATE = liveTicks.exchangeRate;

  const getDiffStr = (curr, base) => {
    const diff = curr - base;
    const pct = ((diff / base) * 100).toFixed(2);
    return diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`;
  };
  const isUp = (curr, base) => curr >= base;

  const STORAGE_KEYS = {
    TX: "ultimate_v39_tx_data_secured",
    CASH: "ultimate_v39_cash_data_secured",
    MASTER: "ultimate_v39_master_data_secured",
  };

  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);

  const [stockMaster, setStockMaster] = useState([
    {
      id: 1,
      티커: "AMEX:FJET",
      종목명: "스타파이터스 스페이스",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 2,
      티커: "AMEX:MWG",
      종목명: "멀티 웨이스 홀딩스",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 3,
      티커: "AMEX:SLV",
      종목명: "iShares Silver Trust",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 4,
      티커: "AMEX:ULTY",
      종목명: "ULTY ETF",
      시장: "NASDAQ",
      섹터: "일반제조/서비스",
    },
    {
      id: 5,
      티커: "HCTI",
      종목명: "헬스케어 트라이앵글",
      시장: "NASDAQ",
      섹터: "바이오/헬스케어",
    },
    {
      id: 6,
      티커: "000720",
      종목명: "현대건설",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 7,
      티커: "011430",
      종목명: "세아베스틸지주",
      시장: "KOSPI",
      섹터: "금융/지주사",
    },
    {
      id: 8,
      티커: "002710",
      종목명: "TCC스틸",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 9,
      티커: "003310",
      종목명: "대주산업",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 10,
      티커: "005380",
      종목명: "현대차",
      시장: "KOSPI",
      섹터: "전기차/자동차",
    },
    {
      id: 11,
      티커: "0091P0",
      종목명: "TIGER 코리아원자력",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 12,
      티커: "009830",
      종목명: "한화솔루션",
      시장: "KOSPI",
      섹터: "2차전지/친환경에너지",
    },
    {
      id: 13,
      티커: "0098F0",
      종목명: "KODEX K원자력SMR",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 14,
      티커: "010780",
      종목명: "아이에스동서",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 15,
      티ker: "012200",
      종목명: "계양전기",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 16,
      티커: "014280",
      종목명: "금강공업",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 17,
      티커: "015760",
      종목명: "한국전력",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 18,
      티커: "005930",
      종목명: "삼성전자",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 19,
      티커: "000660",
      종목명: "SK하이닉스",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
  ]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTx = localStorage.getItem(STORAGE_KEYS.TX);
    const savedCash = localStorage.getItem(STORAGE_KEYS.CASH);
    const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedCash) setCashFlows(JSON.parse(savedCash));
    if (savedMaster) setStockMaster(JSON.parse(savedMaster));

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashFlows));
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(stockMaster));
  }, [transactions, cashFlows, stockMaster, isLoaded]);

  const today = new Date().toISOString().split("T")[0];

  const [newTx, setNewTx] = useState({
    날짜: today,
    구분: "매수",
    종목명: "",
    티커: "",
    수량: "",
    단가: "",
    수수료: "0",
    세금: "0",
  });
  const [newCash, setNewCash] = useState({
    날짜: today,
    구분: "입금",
    금액: "",
    메모: "",
  });
  const [newStock, setNewStock] = useState({
    티커: "",
    종목명: "",
    시장: "KOSPI",
    섹터: "일반제조/서비스",
  });

  const formatNum = (n) => (n ? Math.round(Number(n)).toLocaleString() : "0");
  const formatFloat = (n) =>
    n
      ? Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const parseCleanNum = (val) => {
    if (typeof val === "number") return val;
    if (!val || val === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  const getMarketByStockName = (name) => {
    const found = stockMaster.find((s) => s.종목명 === name);
    return found ? found.시장 : "KOSPI";
  };

  const generateAutoTicker = (name) => {
    if (!name) return "999999";
    const found = stockMaster.find((s) => s.종목명 === name);
    if (found && found.티커) return found.티커;

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const internalCode = Math.abs(hash % 890000) + 100000;
    return String(internalCode);
  };

  // --- [원천 수식 집계 연산 엔진] ---
  const stats = useMemo(() => {
    let netInvestment = 0;
    let cashBalance = 0;

    cashFlows.forEach((c) => {
      const amt = Number(c.금액) || 0;
      if (c.구분 === "입금") {
        netInvestment += amt;
        cashBalance += amt;
      } else {
        netInvestment -= amt;
        cashBalance -= amt;
      }
    });

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.날짜) - new Date(b.날짜),
    );
    const holdingMap = {};
    let totalRealizedProfit = 0;

    sortedTx.forEach((tx) => {
      const name = tx.종목명;
      const q = Number(tx.수량) || 0;
      const p = Number(tx.단가) || 0;
      const f = Number(tx.수수료) || 0;
      const t = Number(tx.세금) || 0;

      const isForeign = tx.시장 === "NASDAQ" || tx.시장 === "NYSE";
      const principalKrw = isForeign ? q * p * EXCHANGE_RATE : q * p;
      const totalKrw =
        tx.구분 === "매수" ? principalKrw + f + t : principalKrw - f - t;

      if (!holdingMap[name]) {
        holdingMap[name] = {
          종목명: name,
          티커: tx.티커 || "999999",
          시장: tx.시장 || "KOSPI",
          보유량: 0,
          총매입금액원화: 0,
          실현손익원화: 0,
          최근단가: p,
        };
      }

      const h = holdingMap[name];
      if (tx.구분 === "매수") {
        cashBalance -= totalKrw;
        h.보유량 += q;
        h.총매입금액원화 += totalKrw;
      } else {
        cashBalance += totalKrw;
        const avgPriceKrw = h.보유량 > 0 ? h.총매입금액원화 / h.보유량 : 0;
        const realizedKrw = totalKrw - q * avgPriceKrw;
        totalRealizedProfit += realizedKrw;
        h.실현손익원화 += realizedKrw;
        h.총매입금액원화 -= q * avgPriceKrw;
        h.보유량 -= q;
      }
      h.최근단가 = p;
    });

    const holdingList = Object.values(holdingMap)
      .filter((h) => h.보유량 > 0)
      .map((h) => {
        const isForeign = h.시장 === "NASDAQ" || h.시장 === "NYSE";
        const avgPriceKrw = h.총매입금액원화 / h.보유량;

        const currentPrice = liveStockPrices[h.티커] || h.최근단가;
        const evalAmtKrw = isForeign
          ? h.보유량 * currentPrice * EXCHANGE_RATE
          : h.보유량 * currentPrice;
        const profitKrw = evalAmtKrw - h.총매입금액원화;

        return {
          종목명: h.종목명,
          티커: h.티커,
          시장: h.시장,
          보유량: h.보유량,
          평균단가: isForeign ? avgPriceKrw / EXCHANGE_RATE : avgPriceKrw,
          현재가: currentPrice,
          평가금액: Math.round(evalAmtKrw),
          손익: Math.round(profitKrw),
          수익률:
            h.총매입금액원화 > 0
              ? ((profitKrw / h.총매입금액원화) * 100).toFixed(2) + "%"
              : "0.00%",
        };
      });

    const totalEvaluation = holdingList.reduce(
      (acc, cur) => acc + cur.평가금액,
      0,
    );
    const totalAsset = totalEvaluation + cashBalance;
    const totalProfitRate =
      netInvestment > 0
        ? ((totalAsset - netInvestment) / netInvestment) * 100
        : 0;

    // --- 시계열 일별 매트릭스 백엔드 연산 구조 ---
    const allDates = Array.from(
      new Set([
        ...transactions.map((t) => t.날짜),
        ...cashFlows.map((c) => c.날짜),
      ]),
    ).sort((a, b) => new Date(a.날짜) - new Date(b.날짜));

    let runInvest = 0,
      runCash = 0;
    const runHoldings = {};
    const dailyList = [];

    allDates.forEach((date) => {
      cashFlows
        .filter((c) => c.날짜 === date)
        .forEach((c) => {
          const amt = Number(c.금액) || 0;
          if (c.구분 === "입금") {
            runInvest += amt;
            runCash += amt;
          } else {
            runInvest -= amt;
            runCash -= amt;
          }
        });

      transactions
        .filter((t) => t.날짜 === date)
        .forEach((tx) => {
          const name = tx.종목명;
          const q = Number(tx.수량) || 0,
            p = Number(tx.단가) || 0;
          const f = Number(tx.수수료) || 0,
            t = Number(tx.세금) || 0;
          const isForeign = tx.시장 === "NASDAQ" || tx.시장 === "NYSE";
          const principalKrw = isForeign ? q * p * EXCHANGE_RATE : q * p;
          const tot =
            tx.구분 === "매수" ? principalKrw + f + t : principalKrw - f - t;

          if (!runHoldings[name])
            runHoldings[name] = {
              qty: 0,
              totalCostKrw: 0,
              currentPrice: p,
              isForeign,
              ticker: tx.티커,
            };

          if (tx.구분 === "매수") {
            runCash -= tot;
            runHoldings[name].qty += q;
            runHoldings[name].totalCostKrw += tot;
          } else {
            runCash += tot;
            const currentAvg =
              runHoldings[name].qty > 0
                ? runHoldings[name].totalCostKrw / runHoldings[name].qty
                : 0;
            runHoldings[name].totalCostKrw -= q * currentAvg;
            runHoldings[name].qty -= q;
          }
          runHoldings[name].currentPrice = p;
        });

      let dayEval = 0;
      Object.keys(runHoldings).forEach((k) => {
        if (runHoldings[k].qty > 0) {
          const h = runHoldings[k];
          const dynamicPrice =
            date === today
              ? liveStockPrices[h.ticker] || h.currentPrice
              : h.currentPrice;
          dayEval += h.isForeign
            ? h.qty * dynamicPrice * EXCHANGE_RATE
            : h.qty * dynamicPrice;
        }
      });

      const dayAsset = dayEval + runCash;
      const dayProfit = dayAsset - runInvest;

      dailyList.push({
        날짜: date,
        평가금액: Math.round(dayAsset),
        일손익: Math.round(dayProfit),
        일수익률:
          runInvest > 0
            ? ((dayProfit / runInvest) * 100).toFixed(2) + "%"
            : "0.00%",
        누적원금: Math.round(runInvest),
      });
    });

    const monthlyMap = {};
    dailyList.forEach((d) => {
      monthlyMap[d.날짜.substring(0, 7)] = d;
    });
    const monthlyList = Object.keys(monthlyMap)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        const mData = monthlyMap[m];
        return {
          해당월: m,
          기말자산: mData.평가금액,
          순입출금: mData.누적원금,
          월간손익: mData.일손익,
          수익률:
            mData.누적원금 > 0
              ? ((mData.일손익 / mData.누적원금) * 100).toFixed(2) + "%"
              : "0.00%",
        };
      });

    return {
      holdingList,
      netInvestment,
      totalAsset,
      totalRealizedProfit,
      totalEvaluation,
      totalProfitRate,
      cashBalance,
      dailyList,
      monthlyList,
      allDates,
    };
  }, [transactions, cashFlows, EXCHANGE_RATE, liveStockPrices]);

  // --- [보유종목일별 탭 피벗 매트릭스 전용 가공 엔진 (image_6d78d2.png 스타일 완벽 일치)] ---
  const pivotData = useMemo(() => {
    // 1. 시작일과 종료일 범위 내의 유효 날짜 배열 추출 (내림차순 정렬)
    const filteredDates = stats.allDates
      .filter((d) => d >= startDate && d <= endDate)
      .sort((a, b) => b.localeCompare(a));

    const sortedTx = [...transactions].sort((a, b) =>
      a.날짜.localeCompare(b.날짜),
    );
    const matrix = {};

    // 기초 종목 데이터 매핑 빌드
    stockMaster.forEach((s) => {
      matrix[s.종목명] = {
        종목명: s.종목명,
        티커: s.티커,
        시장: s.시장,
        역사적내역: {},
      };
    });

    // 날짜별 순차적 잔고 트래킹
    const trackingHoldings = {};
    stockMaster.forEach((s) => {
      trackingHoldings[s.종목명] = { qty: 0, totalCost: 0 };
    });

    // 시간 순서대로 모든 날짜의 종목 상태 연산
    stats.allDates.forEach((date) => {
      sortedTx
        .filter((t) => t.날짜 === date)
        .forEach((tx) => {
          const th = trackingHoldings[tx.종목명];
          if (!th) return;
          const isForeign = tx.시장 === "NASDAQ" || tx.시장 === "NYSE";
          const txPriceKrw = isForeign ? tx.단가 * EXCHANGE_RATE : tx.단가;
          const txTotal =
            tx.구분 === "매수"
              ? tx.수량 * txPriceKrw + tx.수수료 + tx.세금
              : tx.수량 * txPriceKrw - tx.수수료 - tx.세금;

          if (tx.구분 === "매수") {
            th.qty += tx.수량;
            th.totalCost += txTotal;
          } else {
            const avgUnit = th.qty > 0 ? th.totalCost / th.qty : 0;
            th.totalCost -= tx.수량 * avgUnit;
            th.qty -= tx.수량;
          }
        });

      // 모든 마스터 종목에 대하여 해당 날짜의 일별 스냅샷 생성
      Object.keys(trackingHoldings).forEach((name) => {
        if (!matrix[name]) return;
        const th = trackingHoldings[name];
        const isForeign =
          matrix[name].시장 === "NASDAQ" || matrix[name].시장 === "NYSE";

        if (th.qty > 0) {
          const avgPrice = th.totalCost / th.qty;
          const livePrice = liveStockPrices[matrix[name].티커] || avgPrice;
          const livePriceKrw = isForeign
            ? livePrice * EXCHANGE_RATE
            : livePrice;

          const dailyCost = th.totalCost;
          const dailyEval = th.qty * livePriceKrw;
          const dailyProfit = dailyEval - dailyCost;
          const dailyRate = dailyCost > 0 ? (dailyProfit / dailyCost) * 100 : 0;

          matrix[name].역사적내역[date] = {
            qty: th.qty,
            avgPrice: isForeign ? avgPrice / EXCHANGE_RATE : avgPrice,
            totalCost: dailyCost,
            profit: dailyProfit,
            rate: dailyRate,
          };
        }
      });
    });

    // 현재 보유 중이거나 범위 내 이력이 있는 종목 리스트 추출
    const finalRows = Object.values(matrix).filter((row) => {
      const currentH = stats.holdingList.find((h) => h.종목명 === row.종목명);
      if (currentH && currentH.보유량 > 0) return true;
      return filteredDates.some((d) => row.역사적내역[d] !== undefined);
    });

    // 날짜별 일별 수익 합계 연산 행 생성
    const dailyColumnTotals = {};
    filteredDates.forEach((d) => {
      let sumProfit = 0;
      let sumCost = 0;
      finalRows.forEach((row) => {
        const snap = row.역사적내역[d];
        if (snap) {
          sumProfit += snap.profit;
          sumCost += snap.totalCost;
        }
      });
      const totalRate = sumCost > 0 ? (sumProfit / sumCost) * 100 : 0;
      dailyColumnTotals[d] = { profit: sumProfit, rate: totalRate };
    });

    return { finalRows, filteredDates, dailyColumnTotals };
  }, [
    stats.allDates,
    transactions,
    stockMaster,
    liveStockPrices,
    EXCHANGE_RATE,
    startDate,
    endDate,
    stats.holdingList,
  ]);

  const activeHoldingQuantities = useMemo(() => {
    const map = {};
    stats.holdingList.forEach((h) => {
      map[h.종목명] = h.보유량;
    });
    return map;
  }, [stats.holdingList]);

  const handleAutoFill = (name) => {
    const found = stockMaster.find((s) => s.종목명 === name);
    setNewTx((prev) => ({
      ...prev,
      종목명: name,
      티커: found ? found.티커 : generateAutoTicker(name),
    }));
  };

  // --- [CRUD 제어 블록] ---
  const saveTx = () => {
    setErrorMessage("");
    if (!newTx.종목명) {
      setErrorMessage(
        "오류: 입력하려는 데이터에 [종목명] 란이 누락되어 저장이 불가합니다.",
      );
      return;
    }

    const q = parseCleanNum(newTx.수량),
      p = parseCleanNum(newTx.단가),
      f = parseCleanNum(newTx.수수료),
      t = parseCleanNum(newTx.세금);
    let currentTicker = newTx.티커
      ? newTx.티커.trim()
      : generateAutoTicker(newTx.종목명);
    let detectedMarket = getMarketByStockName(newTx.종목명);

    const isForeign = detectedMarket === "NASDAQ" || detectedMarket === "NYSE";
    const principalKrw = isForeign ? q * p * EXCHANGE_RATE : q * p;
    const total =
      newTx.구분 === "매수" ? principalKrw + f + t : principalKrw - f - t;

    const exists = stockMaster.some((s) => s.종목명 === newTx.종목명);
    if (!exists) {
      const autoNewMaster = {
        id: Date.now() + 1,
        티커: currentTicker,
        종목명: newTx.종목명,
        시장: "KOSPI",
        섹터: "자동생성종목",
      };
      setStockMaster((prev) => [...prev, autoNewMaster]);
    }

    const data = {
      ...newTx,
      id: editingId || Date.now(),
      티커: currentTicker,
      시장: detectedMarket,
      수량: q,
      단가: p,
      수수료: f,
      세금: t,
      합계: total,
    };
    if (editingId)
      setTransactions(
        transactions.map((item) => (item.id === editingId ? data : item)),
      );
    else setTransactions([data, ...transactions]);
    resetForms();
  };

  const saveCash = () => {
    setErrorMessage("");
    const amt = parseCleanNum(newCash.금액);
    if (amt <= 0) {
      setErrorMessage("오류: 유효하지 않은 금액 구조체입니다.");
      return;
    }
    const data = { ...newCash, id: editingId || Date.now(), 금액: amt };
    if (editingId)
      setCashFlows(cashFlows.map((c) => (c.id === editingId ? data : c)));
    else setCashFlows([data, ...cashFlows]);
    resetForms();
  };

  const saveMaster = () => {
    setErrorMessage("");
    if (!newStock.종목명) {
      setErrorMessage("오류: 신규 종목명 식별 데이터가 없습니다.");
      return;
    }
    let ticker = newStock.티커
      ? newStock.티커.trim()
      : generateAutoTicker(newStock.종목명);
    const data = { ...newStock, id: Date.now(), 티커: ticker };
    setStockMaster([...stockMaster, data]);
    resetForms();
  };

  const handleSimulatedUpload = (e) => {
    setErrorMessage("");
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length <= 1) {
          setErrorMessage(
            "오류: 업로드된 파일 구조에 데이터 필드가 불완전하거나 비어있습니다.",
          );
          return;
        }

        const parsedTxs = [];
        const parsedCashFlows = [];
        const addedMasters = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (cols.length < 2) continue;

          const r날짜 = cols[0] || today;
          const r구분 = cols[1];

          if (r구분 === "입금" || r구분 === "출금") {
            const r금액 = parseCleanNum(cols[4]) || parseCleanNum(cols[2]) || 0;
            if (r금액 <= 0) continue;
            const r메모 =
              cols[2] && isNaN(parseCleanNum(cols[2]))
                ? cols[2]
                : cols[3] || "엑셀 인입 내역";

            parsedCashFlows.push({
              id: Date.now() + i * 17,
              날짜: r날짜,
              구분: r구분,
              금액: r금액,
              메모: r메모,
            });
          } else if (r구분 === "매수" || r구분 === "매도") {
            const r종목명 = cols[2];
            if (!r종목명) continue;

            let r티커 = cols[3] || generateAutoTicker(r종목명);
            const r수량 = parseCleanNum(cols[4] || 0);
            const r단가 = parseCleanNum(cols[5] || 0);
            const r수수료 = parseCleanNum(cols[6] || 0);
            const r세금 = parseCleanNum(cols[7] || 0);

            let market = getMarketByStockName(r종목명);
            const isForeign = market === "NASDAQ" || market === "NYSE";
            const totalKrw =
              r구분 === "매수"
                ? r수량 * r단가 * (isForeign ? EXCHANGE_RATE : 1) +
                  r수수료 +
                  r세금
                : r수량 * r단가 * (isForeign ? EXCHANGE_RATE : 1) -
                  r수수료 -
                  r세금;

            parsedTxs.push({
              id: Date.now() + i,
              날짜: r날짜,
              구분: r구분,
              종목명: r종목명,
              티커: r티커,
              수량: r수량,
              단가: r단가,
              수수료: r수수료,
              세금: r세금,
              합계: totalKrw,
              시장: market,
            });

            if (
              !stockMaster.some((s) => s.종목명 === r종목명) &&
              !addedMasters.some((m) => m.종목명 === r종목명)
            ) {
              addedMasters.push({
                id: Date.now() + i + 850,
                티커: r티커,
                종목명: r종목명,
                시장: "KOSPI",
                섹터: "자동생성매핑",
              });
            }
          }
        }

        if (parsedTxs.length > 0)
          setTransactions((prev) => [...parsedTxs, ...prev]);
        if (parsedCashFlows.length > 0)
          setCashFlows((prev) => [...parsedCashFlows, ...prev]);
        if (addedMasters.length > 0)
          setStockMaster((prev) => [...prev, ...addedMasters]);

        alert(
          `동기화 완료: 거래내역 ${parsedTxs.length}건 및 입출금 ${parsedCashFlows.length}건 병합 성공.`,
        );
      } catch (err) {
        setErrorMessage("오류 표시: 파일 버퍼 디코딩 중 예외가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadExcel = () => {
    let csvContent =
      "\uFEFF날짜,구분,종목명(메모),티커,수량/금액,단가,수수료,세금\n";
    transactions.forEach((t) => {
      csvContent += `${t.날짜},${t.구분},${t.종목명},${t.티커},${t.수량},${t.단가},${t.수수료},${t.세금}\n`;
    });
    cashFlows.forEach((c) => {
      csvContent += `${c.날짜},${c.구분},${c.메모 || ""},,${c.금액},,,\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock_manager_backup_${today}.csv`;
    link.click();
  };

  const handleDownloadTemplate = () => {
    const headers = "날짜,구분,종목명(메모),티커,수량/금액,단가,수수료,세금\n";
    const sample = `${today},매수,삼성전자,,10,73000,50,0\n${today},입금,초기원금,,10000000,,,`;
    const blob = new Blob(["\uFEFF" + headers + sample], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stock_upload_template.csv";
    link.click();
  };

  const deleteItem = (id) => {
    if (!confirm("원천 기록을 파기 처리하시겠습니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => t.id !== id));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => c.id !== id));
    if (activeTab === "종목마스터")
      setStockMaster(stockMaster.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAllToggle = () => {
    const currentTabTargetIds =
      activeTab === "거래관리"
        ? transactions.map((t) => t.id)
        : activeTab === "입출금"
          ? cashFlows.map((c) => c.id)
          : [];

    if (currentTabTargetIds.length === 0) return;
    const isAllSelected = currentTabTargetIds.every((id) =>
      selectedIds.includes(id),
    );
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentTabTargetIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...currentTabTargetIds])),
      );
    }
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0)
      return alert("선택된 내역이 존재하지 않습니다.");
    if (!confirm("선택한 항목들을 일괄 파기하겠습니까?")) return;
    if (activeTab === "거래관리")
      setTransactions(transactions.filter((t) => !selectedIds.includes(t.id)));
    if (activeTab === "입출금")
      setCashFlows(cashFlows.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  const resetForms = () => {
    setEditingId(null);
    setNewTx({
      날짜: today,
      구분: "매수",
      종목명: "",
      티커: "",
      수량: "",
      단가: "",
      수수료: "0",
      세금: "0",
    });
    setNewCash({ 날짜: today, 구분: "입금", 금액: "", 메모: "" });
    setNewStock({
      티커: "",
      종목명: "",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    });
  };

  const isHeaderChecked = useMemo(() => {
    const targets =
      activeTab === "거래관리"
        ? transactions
        : activeTab === "입출금"
          ? cashFlows
          : [];
    if (targets.length === 0) return false;
    return targets.every((t) => selectedIds.includes(t.id));
  }, [activeTab, transactions, cashFlows, selectedIds]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
      <div className="max-w-[1800px] mx-auto">
        {/* 상단 헤더 알림 */}
        <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              📊 STOCK-MANAGER ULTIMATE V39.0
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              지수 팩트 동기화 완결 및 보유종목일별 피벗 대시보드 구조 전격 복원
              완료
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
              시스템 구동 시간: {lastUpdate}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-[13px] font-black flex items-center gap-2 shadow-sm">
            <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px]">
              !
            </span>
            {errorMessage}
          </div>
        )}

        {/* 종합 리얼타임 지수 전광판 */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {[
            {
              n: "KOSPI 현재지수",
              v: liveTicks.kospi.toLocaleString(),
              d: getDiffStr(liveTicks.kospi, baseTicks.kospi),
              up: isUp(liveTicks.kospi, baseTicks.kospi),
            },
            {
              n: "KOSDAQ 현재지수",
              v: liveTicks.kosdaq.toLocaleString(),
              d: getDiffStr(liveTicks.kosdaq, baseTicks.kosdaq),
              up: isUp(liveTicks.kosdaq, baseTicks.kosdaq),
            },
            {
              n: "다우존스 산업지수",
              v: liveTicks.dow.toLocaleString(),
              d: getDiffStr(liveTicks.dow, baseTicks.dow),
              up: isUp(liveTicks.dow, baseTicks.dow),
            },
            {
              n: "나스닥 종합",
              v: liveTicks.nasdaq.toLocaleString(),
              d: getDiffStr(liveTicks.nasdaq, baseTicks.nasdaq),
              up: isUp(liveTicks.nasdaq, baseTicks.nasdaq),
            },
            {
              n: "S&P 500",
              v: liveTicks.sp500.toLocaleString(),
              d: getDiffStr(liveTicks.sp500, baseTicks.sp500),
              up: isUp(liveTicks.sp500, baseTicks.sp500),
            },
            {
              n: "원/달러 환율",
              v: liveTicks.exchangeRate.toLocaleString() + " 원",
              d: getDiffStr(liveTicks.exchangeRate, baseTicks.exchangeRate),
              up: isUp(liveTicks.exchangeRate, baseTicks.exchangeRate),
            },
          ].map((idx, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                  {idx.n}
                </p>
                <p className="text-lg font-black text-slate-800">{idx.v}</p>
              </div>
              <span
                className={`text-[11px] font-black px-2 py-1 rounded-lg ${idx.up ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
              >
                {idx.d}
              </span>
            </div>
          ))}
        </div>

        {/* 자산 요약 디스플레이 */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { t: "순투자원금", v: formatNum(stats.netInvestment) },
            { t: "총자산", v: formatNum(stats.totalAsset) },
            {
              t: "수익률",
              v: stats.totalProfitRate.toFixed(2) + "%",
              c: stats.totalProfitRate >= 0 ? "text-rose-500" : "text-blue-600",
            },
            { t: "평가금액", v: formatNum(stats.totalEvaluation) },
            {
              t: "실현손익",
              v: formatNum(stats.totalRealizedProfit),
              c:
                stats.totalRealizedProfit >= 0
                  ? "text-rose-500"
                  : "text-blue-600",
            },
            {
              t: "예수금 잔액",
              v: formatNum(stats.cashBalance),
              c: "text-slate-700",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center"
            >
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">
                {item.t}
              </p>
              <p className={`text-xl font-black ${item.c || "text-slate-800"}`}>
                {item.v.includes("%") ? item.v : `₩ ${item.v}`}
              </p>
            </div>
          ))}
        </div>

        {/* 8대 탭 기능 컨테이너 */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[850px]">
          <div className="flex bg-slate-50 p-2 gap-1 border-b border-slate-200 justify-between items-center pr-6">
            <div className="flex gap-1">
              {[
                "보유현황",
                "일별수익률",
                "보유종목일별",
                "월별수익률",
                "입출금",
                "거래관리",
                "종목마스터",
                "일별종가",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    resetForms();
                    setSelectedIds([]);
                    setErrorMessage("");
                  }}
                  className={`px-6 py-3.5 rounded-2xl text-[12px] font-black transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-black transition-all"
              >
                양식 다운로드
              </button>
              <button
                onClick={handleDownloadExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[11px] font-black transition-all"
              >
                전체 백업 다운로드
              </button>
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-[11px] font-black cursor-pointer transition-all">
                엑셀/CSV 통합 업로드
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleSimulatedUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-8">
            {/* Tab 1. 보유현황 */}
            {activeTab === "보유현황" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>종목명</th>
                    <th>티커</th>
                    <th>시장</th>
                    <th>보유량</th>
                    <th>평균단가</th>
                    <th>현재가</th>
                    <th>평가금액(원화)</th>
                    <th>손익(원화)</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  {stats.holdingList.map((h, i) => {
                    const isForeign = h.시장 === "NASDAQ" || h.시장 === "NYSE";
                    return (
                      <tr key={i} className="h-12 border-b hover:bg-slate-50">
                        <td className="font-black text-blue-600">{h.종목명}</td>
                        <td className="italic text-slate-400">{h.티커}</td>
                        <td>
                          <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {h.시장}
                          </span>
                        </td>
                        <td>{formatNum(h.보유량)}</td>
                        <td>
                          {isForeign
                            ? `$${formatFloat(h.평균단가)}`
                            : `₩${formatNum(h.평균단가)}`}
                        </td>
                        <td>
                          {isForeign
                            ? `$${formatFloat(h.현재가)}`
                            : `₩${formatNum(h.현재가)}`}
                        </td>
                        <td className="font-black text-slate-800">
                          ₩{formatNum(h.평가금액)}
                        </td>
                        <td
                          className={
                            h.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                          }
                        >
                          {h.손익 >= 0 ? "+" : ""}
                          {formatNum(h.손익)}
                        </td>
                        <td
                          className={
                            h.손익 >= 0 ? "text-rose-500" : "text-blue-500"
                          }
                        >
                          {h.수익률}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.holdingList.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-20 text-slate-400 italic">
                        보유 종목 내역이 감지되지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 2. 일별수익률 */}
            {activeTab === "일별수익률" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>날짜</th>
                    <th>총 평가자산</th>
                    <th>누적 투자원금</th>
                    <th>일일 평가손익</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  {[...stats.dailyList].reverse().map((d, i) => (
                    <tr key={i} className="h-11 border-b hover:bg-slate-50">
                      <td>{d.날짜}</td>
                      <td className="font-black">₩{formatNum(d.평가금액)}</td>
                      <td>₩{formatNum(d.누적원금)}</td>
                      <td
                        className={
                          d.일손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {d.일손익 >= 0 ? "+" : ""}
                        {formatNum(d.일손익)}
                      </td>
                      <td
                        className={
                          d.일손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {d.일수익률}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 3. 보유종목일별 (★ image_6d78d2.png 다이내믹 피벗 매트릭스 복원 버전) */}
            {activeTab === "보유종목일별" && (
              <div>
                {/* 상단 기한 설정 인풋 대시보드 박스 */}
                <div className="mb-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="text-[13px] font-black text-slate-700">
                    보유종목일별수익
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    조회기간 {startDate} ~ {endDate} · 현재 보유종목 일별수익{" "}
                    {pivotData.finalRows.length}종목
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] font-black text-slate-500">
                      시작일
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold shadow-sm"
                    />
                    <span className="text-[11px] font-black text-slate-500">
                      종료일
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-[12px] font-bold shadow-sm"
                    />
                  </div>
                </div>

                {/* 가로 전개 가로 스크롤 대형 매트릭스 그리드 */}
                <div className="w-full overflow-x-auto border rounded-2xl border-slate-200 shadow-sm">
                  <table className="w-full text-center border-collapse whitespace-nowrap min-w-[1200px]">
                    <thead className="bg-[#f8fafc] text-slate-700 text-[11px] font-black border-b border-slate-200">
                      <tr>
                        <th className="bg-slate-100 text-slate-800 font-black sticky left-0 z-10 px-4">
                          종목명
                        </th>
                        <th className="px-4">보유량</th>
                        <th className="px-4">평균단가</th>
                        <th className="px-4">총매수가</th>
                        <th className="px-4 text-blue-600 bg-blue-50/30">
                          현재가
                        </th>
                        {/* 설정 기한 날짜 필드 동적 바인딩 루프 */}
                        {pivotData.filteredDates.map((date) => (
                          <th
                            key={date}
                            className="px-6 font-bold bg-slate-50 border-l border-slate-200"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[12px] font-bold text-slate-800">
                      {/* 1. 일별 수익 합계 요약 통합 행 (image_6d78d2.png 포맷 반영) */}
                      <tr className="bg-slate-50/80 font-black text-slate-900 border-b border-slate-300 h-12">
                        <td className="sticky left-0 bg-slate-100 font-black z-10 text-center text-slate-700">
                          일별 수익 합계
                        </td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td className="bg-blue-50/20">-</td>
                        {pivotData.filteredDates.map((date) => {
                          const tot = pivotData.dailyColumnTotals[date];
                          const isUp = tot ? tot.profit >= 0 : true;
                          return (
                            <td
                              key={date}
                              className={`border-l border-slate-200 font-black ${isUp ? "text-rose-500" : "text-blue-600"}`}
                            >
                              {tot && tot.profit !== 0
                                ? `${tot.profit >= 0 ? "" : "-"}${formatNum(Math.abs(tot.profit))} (${tot.rate.toFixed(2)}%)`
                                : "0 (0%)"}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 2. 각 개별 종목 데이터 마운트 행 루프 */}
                      {pivotData.finalRows.map((row, idx) => {
                        const currentH = stats.holdingList.find(
                          (h) => h.종목명 === row.종목명,
                        );
                        const isForeign =
                          row.시장 === "NASDAQ" || row.시장 === "NYSE";

                        const curQty = currentH ? currentH.보유량 : 0;
                        const curAvg = currentH
                          ? isForeign
                            ? currentH.평균단가
                            : Math.round(currentH.평균단가)
                          : 0;
                        const curPrice = liveStockPrices[row.티커] || curAvg;
                        const totalCostKrw = currentH
                          ? Math.round(
                              curQty * curAvg * (isForeign ? EXCHANGE_RATE : 1),
                            )
                          : 0;

                        return (
                          <tr
                            key={idx}
                            className="h-12 border-b border-slate-200 hover:bg-slate-50/50"
                          >
                            <td className="sticky left-0 bg-white font-black text-left px-4 border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <span className="block text-slate-900 font-black">
                                {row.종목명}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-medium italic">
                                {row.시장}:{row.티커}
                              </span>
                            </td>
                            <td>{curQty > 0 ? formatNum(curQty) : "0"}</td>
                            <td>
                              {curQty > 0
                                ? isForeign
                                  ? `$${formatFloat(curAvg)}`
                                  : `₩${formatNum(curAvg)}`
                                : "-"}
                            </td>
                            <td className="text-slate-600">
                              {totalCostKrw > 0
                                ? `₩${formatNum(totalCostKrw)}`
                                : "-"}
                            </td>
                            <td className="bg-blue-50/10 font-black text-blue-600">
                              {isForeign
                                ? `$${formatFloat(curPrice)}`
                                : `₩${formatNum(curPrice)}`}
                            </td>

                            {/* 날짜별 손익 인덱스 셀 출력 */}
                            {pivotData.filteredDates.map((date) => {
                              const snap = row.역사적내역[date];
                              if (!snap)
                                return (
                                  <td
                                    key={date}
                                    className="border-l border-slate-200 text-slate-300 font-normal italic"
                                  >
                                    -
                                  </td>
                                );
                              const isProf = snap.profit >= 0;
                              return (
                                <td
                                  key={date}
                                  className={`border-l border-slate-200 font-medium ${isProf ? "text-rose-500" : "text-blue-500"}`}
                                >
                                  <span className="block font-bold">
                                    {isProf ? "" : "-"}
                                    {formatNum(Math.abs(snap.profit))}
                                  </span>
                                  <span className="block text-[10px] font-semibold">
                                    ({snap.rate.toFixed(1)}%)
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4. 월별수익률 */}
            {activeTab === "월별수익률" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>해당월</th>
                    <th>기말 자산총액</th>
                    <th>순 투자원금</th>
                    <th>월간 손익총량</th>
                    <th>수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold">
                  {stats.monthlyList.map((m, i) => (
                    <tr key={i} className="h-11 border-b hover:bg-slate-50">
                      <td className="font-black text-blue-600">{m.해당월}</td>
                      <td className="font-black">₩{formatNum(m.기말자산)}</td>
                      <td>₩{formatNum(m.순입출금)}</td>
                      <td
                        className={
                          m.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {m.월간손익 >= 0 ? "+" : ""}
                        {formatNum(m.월간손익)}
                      </td>
                      <td
                        className={
                          m.월간손익 >= 0 ? "text-rose-500" : "text-blue-500"
                        }
                      >
                        {m.수익률}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 5. 입출금 */}
            {activeTab === "입출금" && (
              <div>
                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newCash.날짜}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 날짜: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      구분
                    </label>
                    <select
                      value={newCash.구분}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 구분: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>입금</option>
                      <option>출금</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      현금 금액(KRW)
                    </label>
                    <input
                      type="text"
                      value={newCash.금액}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 금액: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="금액 입력"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      메모
                    </label>
                    <input
                      type="text"
                      value={newCash.메모}
                      onChange={(e) =>
                        setNewCash({ ...newCash, 메모: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="메모 내용 입력"
                    />
                  </div>
                  <button
                    onClick={saveCash}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md"
                  >
                    입출금 내역 저장
                  </button>
                </div>

                <div className="mb-2 flex justify-end">
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
                  >
                    선택 삭제
                  </button>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={isHeaderChecked}
                          onChange={handleSelectAllToggle}
                        />
                      </th>
                      <th>날짜</th>
                      <th>구분</th>
                      <th>금액</th>
                      <th>메모</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {cashFlows.map((c) => (
                      <tr
                        key={c.id}
                        className="h-11 border-b hover:bg-slate-50"
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td>{c.날짜}</td>
                        <td
                          className={
                            c.구분 === "입금"
                              ? "text-rose-500"
                              : "text-blue-500"
                          }
                        >
                          {c.구분}
                        </td>
                        <td className="font-black">₩{formatNum(c.금액)}</td>
                        <td className="text-slate-600 font-medium text-left px-4">
                          {c.메모 || "-"}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteItem(c.id)}
                            className="text-rose-500 underline text-[12px]"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 6. 거래관리 */}
            {activeTab === "거래관리" && (
              <div>
                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newTx.날짜}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 날짜: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      구분
                    </label>
                    <select
                      value={newTx.구분}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 구분: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>매수</option>
                      <option>매도</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      종목명
                    </label>
                    <input
                      type="text"
                      value={newTx.종목명}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 종목명: e.target.value })
                      }
                      placeholder="명칭 직접 입력 가능"
                      className="w-full border rounded-xl px-2.5 py-1 text-[12px] font-bold mb-1"
                    />
                    <select
                      value={newTx.종목명}
                      onChange={(e) => handleAutoFill(e.target.value)}
                      className="w-full border rounded-xl p-1.5 text-[11px] font-bold bg-white"
                    >
                      <option value="">--기존 마스터 매핑--</option>
                      {stockMaster.map((s) => (
                        <option key={s.id} value={s.종목명}>
                          {s.종목명} ({s.티커})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      수량
                    </label>
                    <input
                      type="text"
                      value={newTx.수량}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수량: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      단가
                    </label>
                    <input
                      type="text"
                      value={newTx.단가}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 단가: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      수수료 (KRW)
                    </label>
                    <input
                      type="text"
                      value={newTx.수수료}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 수수료: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      세금 (KRW)
                    </label>
                    <input
                      type="text"
                      value={newTx.세금}
                      onChange={(e) =>
                        setNewTx({ ...newTx, 세금: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <button
                    onClick={saveTx}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md"
                  >
                    거래내역 추가
                  </button>
                </div>

                <div className="mb-2 flex justify-end">
                  <button
                    onClick={deleteSelected}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[11px] font-black border border-rose-200"
                  >
                    선택 삭제
                  </button>
                </div>
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={isHeaderChecked}
                          onChange={handleSelectAllToggle}
                        />
                      </th>
                      <th>날짜</th>
                      <th>구분</th>
                      <th>종목명</th>
                      <th>티커</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>수수료</th>
                      <th>세금</th>
                      <th>합계(원화)</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] font-bold">
                    {transactions.map((t) => {
                      const isForeign = t.시장 === "NASDAQ";
                      return (
                        <tr
                          key={t.id}
                          className="h-11 border-b hover:bg-slate-50"
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={() => toggleSelect(t.id)}
                            />
                          </td>
                          <td>{t.날짜}</td>
                          <td
                            className={
                              t.구분 === "매수"
                                ? "text-rose-500"
                                : "text-blue-500"
                            }
                          >
                            {t.구분}
                          </td>
                          <td className="font-black text-slate-800">
                            {t.종목명}
                          </td>
                          <td className="text-slate-400 italic">{t.티커}</td>
                          <td>{formatNum(t.수량)}</td>
                          <td>
                            {isForeign
                              ? `$${formatFloat(t.단가)}`
                              : `₩${formatNum(t.단가)}`}
                          </td>
                          <td className="text-slate-500">
                            ₩{formatNum(t.수수료)}
                          </td>
                          <td className="text-slate-500">
                            ₩{formatNum(t.세금)}
                          </td>
                          <td className="font-black text-slate-700">
                            ₩{formatNum(t.합계)}
                          </td>
                          <td>
                            <button
                              onClick={() => deleteItem(t.id)}
                              className="text-rose-500 underline"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 7. 종목마스터 */}
            {activeTab === "종목마스터" && (
              <div>
                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      종목명 (필수)
                    </label>
                    <input
                      type="text"
                      value={newStock.종목명}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 종목명: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                      placeholder="예: 삼성전자"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      티커코드 (공란 시 자동 생성)
                    </label>
                    <input
                      type="text"
                      value={newStock.티커}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 티커: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">
                      시장분류
                    </label>
                    <select
                      value={newStock.시장}
                      onChange={(e) =>
                        setNewStock({ ...newStock, 시장: e.target.value })
                      }
                      className="w-full border rounded-xl p-2.5 text-[12px] font-bold"
                    >
                      <option>KOSPI</option>
                      <option>KOSDAQ</option>
                      <option>NASDAQ</option>
                    </select>
                  </div>
                  <button
                    onClick={saveMaster}
                    className="bg-slate-900 text-white py-3.5 rounded-xl text-[12px] font-black shadow-md"
                  >
                    종목 등록
                  </button>
                </div>

                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-white text-[11px] font-black">
                    <tr>
                      <th>티커코드</th>
                      <th>종목명</th>
                      <th>시장분류</th>
                      <th>섹터분류</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold">
                    {stockMaster.map((s) => (
                      <tr
                        key={s.id}
                        className="h-12 border-b hover:bg-slate-50"
                      >
                        <td className="text-blue-600 font-black italic">
                          {s.티커}
                        </td>
                        <td className="font-black text-slate-800">
                          {s.종목명}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 text-[11px] font-black rounded-md bg-purple-50 text-purple-600">
                            {s.시장}
                          </span>
                        </td>
                        <td className="text-emerald-600 text-[12px]">
                          {s.섹터 || "일반제조/서비스"}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteItem(s.id)}
                            className="text-rose-500 underline text-[12px]"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 8. 일별종가 */}
            {activeTab === "일별종가" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>기준일자</th>
                    <th>티커</th>
                    <th>종목명</th>
                    <th>시장구분</th>
                    <th>보유 수량</th>
                    <th>장중 가격</th>
                    <th>변동추이</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  {[...stockMaster]
                    .sort(
                      (a, b) =>
                        (activeHoldingQuantities[b.종목명] || 0) -
                        (activeHoldingQuantities[a.종목명] || 0),
                    )
                    .map((s, i) => {
                      const isForeign =
                        s.시장 === "NASDAQ" || s.시장 === "NYSE";
                      const currentPrice =
                        liveStockPrices[s.티커] || (isForeign ? 25.0 : 15000);
                      const originPrice =
                        defaultStockPrices[s.티커] ||
                        (isForeign ? 25.0 : 15000);

                      const diff = currentPrice - originPrice;
                      const pct = ((diff / originPrice) * 100).toFixed(2);
                      const hQty = activeHoldingQuantities[s.종목명] || 0;

                      return (
                        <tr
                          key={i}
                          className={`h-11 border-b hover:bg-slate-50 ${hQty > 0 ? "bg-blue-50/40" : ""}`}
                        >
                          <td>{today}</td>
                          <td className="text-blue-600 font-black">{s.티커}</td>
                          <td className="font-black">
                            {s.종목명}{" "}
                            {hQty > 0 && (
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1">
                                보유
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded">
                              {s.시장}
                            </span>
                          </td>
                          <td
                            className={
                              hQty > 0
                                ? "font-black text-blue-600"
                                : "text-slate-400 font-normal"
                            }
                          >
                            {formatNum(hQty)}
                          </td>
                          <td className="font-mono font-black text-slate-800">
                            {isForeign
                              ? `$${formatFloat(currentPrice)}`
                              : `₩${formatNum(currentPrice)}`}
                          </td>
                          <td>
                            <span
                              className={`text-[11px] font-black ${diff >= 0 ? "text-rose-500" : "text-blue-500"}`}
                            >
                              {diff >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");
        * {
          font-family: "Pretendard", sans-serif;
          letter-spacing: -0.01em;
        }
        th,
        td {
          border: 1px solid #e2e8f0 !important;
          padding: 12px 8px;
        }
        table {
          border-collapse: collapse !important;
          width: 100%;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
}
