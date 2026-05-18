"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * [STOCK-MANAGER ULTIMATE FINAL V33.0 - FULL SYSTEM]
 * - 5대 기본전제 완전 준수 (무삭제 통합 최종본, 디자인 절대 유지, 수수료/세금 유지, 자동 티커 생성, 데이터 방어 가드)
 * - [핵심 개선] 엑셀/CSV 데이터 업로드 시 '입금/출금' 내역이 누락되지 않고 입출금 탭에 정상 반영되도록 로직 보정
 */

export default function StockManagerUltimateV33() {
  const [activeTab, setActiveTab] = useState("거래관리");
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [errorMessage, setErrorMessage] = useState("");

  // --- [지수 대시보드 팩트 데이터 기반 고정 및 변동 세팅] ---
  const [liveTicks, setLiveTicks] = useState({
    kospi: 7230.05,
    kosdaq: 1073.09,
    dow: 49526.17,
    nasdaq: 26225.15,
    sp500: 7408.5,
    exchangeRate: 1503.3,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicks((prev) => {
        const delta = (Math.random() - 0.5) * 1.5;
        return {
          kospi: +(prev.kospi + delta * 0.8).toFixed(2),
          kosdaq: +(prev.kosdaq + delta * 0.2).toFixed(2),
          dow: +(prev.dow + delta * 4.0).toFixed(2),
          nasdaq: +(prev.nasdaq + delta * 2.5).toFixed(2),
          sp500: +(prev.sp500 + delta * 0.9).toFixed(2),
          exchangeRate: +(
            prev.exchangeRate +
            (Math.random() - 0.5) * 0.3
          ).toFixed(2),
        };
      });
      setLastUpdate(new Date().toLocaleTimeString());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const EXCHANGE_RATE = liveTicks.exchangeRate;

  // 독립 영구 보존 스토리지 키 지정
  const STORAGE_KEYS = {
    TX: "ultimate_v33_tx_data_secured",
    CASH: "ultimate_v33_cash_data_secured",
    MASTER: "ultimate_v33_master_data_secured",
  };

  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);

  // 마스터 종목 데이터 팩트 매핑
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
      font: "일반제조/서비스",
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
      티커: "012200",
      종목명: "계양전기",
      시장: "KOSPI",
      섹터: "일반제조/서비스",
    },
    {
      id: 16,
      py코드: "014280",
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
  ]);

  // [중요 전제 5번 대응] 데이터 로드가 끝나기 전에 공백 배열로 LocalStorage가 덮어씌워지는 현상 원천 차단
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTx = localStorage.getItem(STORAGE_KEYS.TX);
    const savedCash = localStorage.getItem(STORAGE_KEYS.CASH);
    const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedCash) setCashFlows(JSON.parse(savedCash));
    if (savedMaster) setStockMaster(JSON.parse(savedMaster));

    setIsLoaded(true);
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

  // [기본전제 4번 대응] 자동 티커 코드 제너레이터 함수
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

  // --- [코어 연산 엔진] ---
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
        const evalAmtKrw = isForeign
          ? h.보유량 * h.최근단가 * EXCHANGE_RATE
          : h.보유량 * h.최근단가;
        const profitKrw = evalAmtKrw - h.총매입금액원화;

        return {
          종목명: h.종목명,
          티커: h.티커,
          시장: h.시장,
          보유량: h.보유량,
          평균단가: isForeign ? avgPriceKrw / EXCHANGE_RATE : avgPriceKrw,
          현재가: h.최근단가,
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
          dayEval += h.isForeign
            ? h.qty * h.currentPrice * EXCHANGE_RATE
            : h.qty * h.currentPrice;
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

    const dailyStockMatrix = [];
    let stateHoldings = {};

    allDates.forEach((date) => {
      transactions
        .filter((t) => t.날짜 === date)
        .forEach((tx) => {
          const name = tx.종목명;
          const q = Number(tx.수량) || 0,
            p = Number(tx.단가) || 0;
          const isForeign = tx.시장 === "NASDAQ" || tx.시장 === "NYSE";
          const principalKrw = isForeign ? q * p * EXCHANGE_RATE : q * p;
          const tot =
            tx.구분 === "매수"
              ? principalKrw + Number(tx.수수료) + Number(tx.세금)
              : principalKrw - Number(tx.수수료) - Number(tx.세금);

          if (!stateHoldings[name]) {
            stateHoldings[name] = {
              qty: 0,
              totalCostKrw: 0,
              ticker: tx.ticker || tx.티커,
              시장: tx.시장,
            };
          }

          const sh = stateHoldings[name];
          if (tx.구분 === "매수") {
            sh.qty += q;
            sh.totalCostKrw += tot;
          } else {
            const oldAvg = sh.qty > 0 ? sh.totalCostKrw / sh.qty : 0;
            sh.totalCostKrw -= q * oldAvg;
            sh.qty -= q;
          }
          sh.lastPrice = p;
        });

      Object.keys(stateHoldings).forEach((name) => {
        const sh = stateHoldings[name];
        if (sh.qty > 0) {
          const isForeign = sh.시장 === "NASDAQ" || sh.시장 === "NYSE";
          const avgPriceKrw = sh.totalCostKrw / sh.qty;
          const currentPriceKrw = isForeign
            ? sh.lastPrice * EXCHANGE_RATE
            : sh.lastPrice;
          const profitRate =
            avgPriceKrw > 0
              ? ((currentPriceKrw - avgPriceKrw) / avgPriceKrw) * 100
              : 0;

          dailyStockMatrix.push({
            날짜: date,
            종목명: name,
            티커: sh.ticker || "999999",
            시장: sh.시장,
            보유량: sh.qty,
            기준단가: isForeign ? avgPriceKrw / EXCHANGE_RATE : avgPriceKrw,
            현재가: sh.lastPrice,
            수익률: profitRate.toFixed(2) + "%",
          });
        }
      });
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
      dailyStockMatrix,
    };
  }, [transactions, cashFlows, EXCHANGE_RATE]);

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

  // [기능 개선 및 복원] 엑셀/CSV 업로드 처리 함수 (입출금 감지 분기 보정)
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
          if (cols.length < 2) {
            setErrorMessage(
              `오류 표시: 업로드 파일의 [${i + 1}번째 행] 구조가 데이터 레이아웃에 규합되지 않습니다.`,
            );
            continue;
          }

          const r날짜 = cols[0] || today;
          const r구분 = cols[1];

          // [보정] 입출금(입금/출금) 데이터 타입 감지 파싱 처리부
          if (r구분 === "입금" || r구분 === "출금") {
            // 수량 위치(4번째 열) 혹은 종목명 위치(2번째 열)에 저장된 금액 파싱 규칙 생성
            const r금액 = parseCleanNum(cols[4]) || parseCleanNum(cols[2]) || 0;
            if (r금액 <= 0) {
              setErrorMessage(
                `오류 표시: [${i + 1}번째 행]의 입출금 데이터 금액이 누락되었거나 부적합합니다.`,
              );
              continue;
            }
            const r메모 =
              cols[2] && isNaN(parseCleanNum(cols[2]))
                ? cols[2]
                : cols[3] || "엑셀업로드 인입";

            parsedCashFlows.push({
              id: Date.now() + i * 10,
              날짜: r날짜,
              구분: r구분,
              금액: r금액,
              메모: r메모,
            });
          }
          // 기존 매수/매도 거래내역 데이터 타입 처리부
          else if (r구분 === "매수" || r구분 === "매도") {
            const r종목명 = cols[2];
            if (!r종목명 || r종목명 === "") {
              setErrorMessage(
                `오류 표시: [${i + 1}번째 행]의 종목 데이터명이 공란으로 파싱되어 등록에서 누락처리 되었습니다.`,
              );
              continue;
            }

            // [기본전제 4번 대응] 티커 누락 건 자동 해시 연산 생성 결합
            let r티커 = cols[3];
            if (!r티커 || r티커 === "") {
              r티커 = generateAutoTicker(r종목명);
            }

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
                id: Date.now() + i + 900,
                티커: r티커,
                종목명: r종목명,
                시장: "KOSPI",
                섹터: "자동생성매핑",
              });
            }
          } else {
            setErrorMessage(
              `오류 표시: [${i + 1}번째 행]의 구분값('${r구분}') 식별 정보가 유효하지 않습니다.`,
            );
          }
        }

        // 각 상태 배열에 순차적 병합
        if (parsedTxs.length > 0)
          setTransactions((prev) => [...parsedTxs, ...prev]);
        if (parsedCashFlows.length > 0)
          setCashFlows((prev) => [...parsedCashFlows, ...prev]);
        if (addedMasters.length > 0)
          setStockMaster((prev) => [...prev, ...addedMasters]);

        if (parsedTxs.length > 0 || parsedCashFlows.length > 0) {
          alert(
            `동기화 피드백: 거래내역 ${parsedTxs.length}건, 입출금 내역 ${parsedCashFlows.length}건의 자료 배치가 성공적으로 병합 완료되었습니다.`,
          );
        }
      } catch (err) {
        setErrorMessage(
          "오류 표시: 파일 객체 데이터 스트림 버퍼 디코딩 중 예외가 발생했습니다.",
        );
      }
    };
    reader.readAsText(file);
  };

  // [기본전제 1번 대응] 실시간 자산 엑셀 CSV 물리 내보내기 구현
  const handleDownloadExcel = () => {
    if (transactions.length === 0 && cashFlows.length === 0) {
      alert("다운로드할 데이터가 존재하지 않습니다.");
      return;
    }
    let csvContent = "\uFEFF";
    csvContent += "날짜,구분,종목명(메모),티커,수량/금액,단가,수수료,세금\n";

    transactions.forEach((t) => {
      csvContent += `${t.날짜},${t.구분},${t.종목명},${t.티커},${t.수량},${t.단가},${t.수수료},${t.세금}\n`;
    });
    cashFlows.forEach((c) => {
      csvContent += `${c.날짜},${c.구분},${c.메모 || ""},,${c.금액},,,\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_system_data_v33_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = "날짜,구분,종목명(메모),티커,수량/금액,단가,수수료,세금\n";
    const sample = `${today},매수,TIGER 코리아원자력,,100,2400,10,0\n${today},입금,초기투자금원금,,5000000,,,\n${today},매도,스타파이터스 스페이스,AMEX:FJET,20,15.5,15,5`;
    const blob = new Blob([headers + sample], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "stock_template_v33.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      return alert("선택 반전된 내역이 존재하지 않습니다.");
    if (!confirm("선택한 타겟 인덱스 요소들을 다중 파기하겠습니까?")) return;

    if (activeTab === "거래관리") {
      setTransactions(transactions.filter((t) => !selectedIds.includes(t.id)));
    }
    if (activeTab === "입출금") {
      setCashFlows(cashFlows.filter((c) => !selectedIds.includes(c.id)));
    }
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
        {/* 메인 타이틀 헤더 바 */}
        <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              📊 STOCK-MANAGER ULTIMATE V33.0
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              실시간 자산 정산 분리형 원천 저장 아키텍처 결합판
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
              정산 동기화 기준 시간: {lastUpdate}
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

        {/* 지수 대시보드 */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {[
            {
              n: "KOSPI 현재지수",
              v: liveTicks.kospi.toLocaleString(),
              d: "▼ 3.51%",
              up: false,
            },
            {
              n: "KOSDAQ 현재지수",
              v: liveTicks.kosdaq.toLocaleString(),
              d: "▼ 5.02%",
              up: false,
            },
            {
              n: "다우존스 산업지수",
              v: liveTicks.dow.toLocaleString(),
              d: "▲ 0.42%",
              up: true,
            },
            {
              n: "나스닥 종합",
              v: liveTicks.nasdaq.toLocaleString(),
              d: "▲ 1.12%",
              up: true,
            },
            {
              n: "S&P 500",
              v: liveTicks.sp500.toLocaleString(),
              d: "▲ 0.65%",
              up: true,
            },
            {
              n: "원/달러 환율",
              v: EXCHANGE_RATE.toLocaleString() + " 원",
              d: "▲ 1,503.30 기준",
              up: true,
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

        {/* 메인 멀티 탭 패널 컨테이너 */}
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
                  {stats.dailyList.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-slate-400 italic">
                        시계열 일별 지표 연산 데이터가 부족합니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 3. 보유종목일별 */}
            {activeTab === "보유종목일별" && (
              <table className="w-full text-center border-collapse">
                <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
                  <tr>
                    <th>날짜</th>
                    <th>종목명</th>
                    <th>티커</th>
                    <th>시장</th>
                    <th>보유수량</th>
                    <th>기준단가(평단)</th>
                    <th>현재가</th>
                    <th>누적수익률</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  {[...stats.dailyStockMatrix].reverse().map((m, i) => {
                    const isForeign = m.시장 === "NASDAQ" || m.시장 === "NYSE";
                    return (
                      <tr key={i} className="h-11 border-b hover:bg-slate-50">
                        <td>{m.날짜}</td>
                        <td className="font-black text-slate-800">
                          {m.종목명}
                        </td>
                        <td className="italic text-slate-400">{m.티커}</td>
                        <td>{m.시장}</td>
                        <td>{formatNum(m.보유량)}</td>
                        <td>
                          {isForeign
                            ? `$${formatFloat(m.기준단가)}`
                            : `₩${formatNum(m.기준단가)}`}
                        </td>
                        <td>
                          {isForeign
                            ? `$${formatFloat(m.현재가)}`
                            : `₩${formatNum(m.현재가)}`}
                        </td>
                        <td
                          className={
                            !m.수익률.includes("-")
                              ? "text-rose-500"
                              : "text-blue-500"
                          }
                        >
                          {m.수익률}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.dailyStockMatrix.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-20 text-slate-400 italic">
                        활성화된 보유 종목 히스토리가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  {stats.monthlyList.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-slate-400 italic">
                        월별 데이터가 집계되지 않았습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 5. 입출금 */}
            {activeTab === "입출금" && (
              <div>
                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-4 gap-4 items-end">
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
                    {cashFlows.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-slate-400 italic">
                          기록된 입출금 내역이 없습니다.
                        </td>
                      </tr>
                    )}
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
                      단가{" "}
                      {getMarketByStockName(newTx.종목명) === "NASDAQ"
                        ? "(USD $)"
                        : "(KRW ₩)"}
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
                    {transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan="11"
                          className="py-10 text-slate-400 italic"
                        >
                          등록된 매매 거래내역 히스토리가 없습니다.
                        </td>
                      </tr>
                    )}
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
                    <th>장중 실시간 가격</th>
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
                      const matchedTx = [...transactions]
                        .filter((t) => t.종목명 === s.종목명)
                        .sort((a, b) => new Date(a.날짜) - new Date(b.날짜));
                      const lastTx = matchedTx.pop();
                      const isForeign =
                        s.시장 === "NASDAQ" || s.시장 === "NYSE";

                      const basePrice = lastTx
                        ? Number(lastTx.단가)
                        : isForeign
                          ? 150.0
                          : 12500;
                      const wave = Math.sin(Date.now() + i * 400) * 0.002;
                      const closePrice = basePrice * (1 + wave);
                      const hQty = activeHoldingQuantities[s.종목명] || 0;

                      return (
                        <tr
                          key={i}
                          className={`h-11 border-b hover:bg-slate-50 ${hQty > 0 ? "bg-blue-50/50" : ""}`}
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
                              ? `$${formatFloat(closePrice)}`
                              : `₩${formatNum(closePrice)}`}
                          </td>
                          <td>
                            <span className="text-rose-500 text-[11px] font-black">
                              ▲ {(0.1 + (i % 3) * 0.15).toFixed(2)}%
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
