"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AppHeader from "@/components/app-header";
import AssetSummaryGrid from "@/components/asset-summary-grid";
import AuthManagementTab from "@/components/auth-management-tab";
import CashFlowsTab from "@/components/cash-flows-tab";
import DailyPricesTab from "@/components/daily-prices-tab";
import DailyReturnsTab from "@/components/daily-returns-tab";
import HoldingsTab from "@/components/holdings-tab";
import MarketIndexGrid from "@/components/market-index-grid";
import MonthlyReturnsTab from "@/components/monthly-returns-tab";
import PivotHistoryTab from "@/components/pivot-history-tab";
import StockMasterTab from "@/components/stock-master-tab";
import TabNavigation from "@/components/tab-navigation";
import TransactionsTab from "@/components/transactions-tab";
import {
  applyManualPrice,
  buildCashPayload,
  buildStockSaveResult,
  buildTransactionPayload,
  createEditableStock,
  createEditableTransaction,
  getSelectableTargets,
  parseCleanNum,
  removeItemByTab,
  removeSelectedByTab,
  toggleAllSelectedIds,
  toggleSelectedId,
  upsertTransaction,
} from "@/lib/crud-utils";
import {
  buildCashCsvRows,
  buildMasterCsvRows,
  buildTransactionsCsvRows,
  downloadCsv,
  parseCashFlowsCsv,
  parseStockMasterCsv,
  parseTransactionsCsv,
  readTextFile,
} from "@/lib/csv-utils";
import { buildPortfolioStats } from "@/lib/portfolio-stats";
import { inferMarketFromTicker, isForeignMarket } from "@/lib/market-utils";
import { buildActiveHoldingQuantities, buildPivotData } from "@/lib/pivot-data";
import {
  createInitialCash,
  createInitialManualPriceForm,
  createInitialStock,
  createInitialTx,
  DEFAULT_STOCK_PRICES as defaultStockPrices,
  INITIAL_LIVE_TICKS,
  INITIAL_STOCK_MASTER,
  STORAGE_KEYS,
} from "@/lib/seed-data";

const DAILY_CLOSE_SYNC_KEY = "ultimate_v39_11_daily_close_sync_date";

const formatToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateText, offset) => {
  const date = new Date(dateText);
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
};

/**
 * [STOCK-MANAGER ULTIMATE FINAL V39.11 - PIVOT FILTER PATCH]
 * - [개선] '보유종목일별' 탭의 시작일/종료일 지정 후 [조회] 버튼 클릭 시 필터링 완벽 바인딩
 * - [보존] 외국주식 시장분류 수정 시 거래단가, 수수료, 세금 통화 자동 변경 스위칭 유지
 * - [준수] 5대 기본 전제 완벽 준수 및 단 한 줄의 생략도 없는 무삭제 완전체 코드
 */

export default function StockManagerUltimateV39_11() {
  const today = formatToday();
  const defaultStartDate = shiftDate(today, -4);

  const [activeTab, setActiveTab] = useState("보유현황");
  const [editingId, setEditingId] = useState(null);
  const [cashEditingId, setCashEditingId] = useState(null);
  const [masterEditingId, setMasterEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [errorMessage, setErrorMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authUsers, setAuthUsers] = useState([]);
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [bootstrapForm, setBootstrapForm] = useState({
    username: "",
    displayName: "관리자",
    password: "",
  });
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "user",
  });
  const [canBootstrap, setCanBootstrap] = useState(true);
  const isAdminUser = authUser?.role === "admin";

  const fileInputRef = useRef(null);
  const tabCashCsvRef = useRef(null);
  const tabTxCsvRef = useRef(null);
  const tabMasterCsvRef = useRef(null);

  // --- [조회 기간 필터 및 실동작 트리거 상태] ---
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);
  const [appliedFilter, setAppliedFilter] = useState({
    start: defaultStartDate,
    end: today,
  });

  // --- [기준 가격 및 실시간 틱 데이터] ---
  const [liveTicks, setLiveTicks] = useState(INITIAL_LIVE_TICKS);
  const [indexChangePercents, setIndexChangePercents] = useState({
    kospi: 0,
    kosdaq: 0,
    dow: 0,
    nasdaq: 0,
    sp500: 0,
    exchangeRate: 0,
  });

  const [liveStockPrices, setLiveStockPrices] = useState(defaultStockPrices);
  const [afterHoursPrices, setAfterHoursPrices] = useState({});
  const [afterHoursStatus, setAfterHoursStatus] = useState({});
  const [dailyPriceSnapshots, setDailyPriceSnapshots] = useState({});
  const [dailyPriceHistoryMap, setDailyPriceHistoryMap] = useState({});
  const [livePriceStatus, setLivePriceStatus] = useState({});

  // --- [핵심 데이터 엔티티 상태 배열] ---
  const [transactions, setTransactions] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [stockMaster, setStockMaster] = useState(INITIAL_STOCK_MASTER);
  const [cashAdjustment, setCashAdjustment] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);

  // --- [개별 입력 폼 상태 구조 정의] ---
  const [newTx, setNewTx] = useState(() => createInitialTx(today));
  const [newCash, setNewCash] = useState(() => createInitialCash(today));
  const [newStock, setNewStock] = useState(createInitialStock);
  const [manualPriceForm, setManualPriceForm] = useState(
    createInitialManualPriceForm,
  );
  const [cashTotalInput, setCashTotalInput] = useState("");

  const effectiveLivePrices = useMemo(() => {
    const next = { ...liveStockPrices };
    Object.keys(afterHoursPrices || {}).forEach((ticker) => {
      const source = afterHoursStatus?.[ticker]?.source;
      const isAfterSource =
        source === "post" || source === "pre" || source === "naver_after";
      if (isAfterSource && Number.isFinite(Number(afterHoursPrices[ticker]))) {
        next[ticker] = Number(afterHoursPrices[ticker]);
      }
    });
    return next;
  }, [liveStockPrices, afterHoursPrices, afterHoursStatus]);

  const refreshDailyPrices = useCallback(async () => {
    const response = await fetch("/api/daily-prices?raw=1", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("일별 종가 데이터를 불러오지 못했습니다.");
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return;
    }

    const sortedRows = [...rows].sort((a, b) => {
      if (a.code !== b.code) return String(a.code).localeCompare(String(b.code));
      return String(b.date).localeCompare(String(a.date));
    });

    const snapshotMap = {};
    const historyMap = {};

    sortedRows.forEach((row) => {
      const code = row.code;
      const date = row.date;
      const price = Number(row.price);

      if (!code || !date || !Number.isFinite(price)) return;

      if (!historyMap[code]) {
        historyMap[code] = {};
      }
      historyMap[code][date] = price;

      if (!snapshotMap[code]) {
        snapshotMap[code] = {
          code,
          latestDate: date,
          latestPrice: price,
          previousDate: null,
          previousPrice: null,
          oldestDate: date,
          rowCount: 1,
        };
      } else {
        snapshotMap[code].rowCount += 1;
        snapshotMap[code].oldestDate = date;
        if (!snapshotMap[code].previousDate) {
          snapshotMap[code].previousDate = date;
          snapshotMap[code].previousPrice = price;
        }
      }
    });

    setDailyPriceSnapshots(snapshotMap);
    setDailyPriceHistoryMap(historyMap);
  }, []);

  // 종목 현재가 기본값만 유지하고, 난수 시뮬레이션은 제거
  useEffect(() => {
    setLiveStockPrices((prev) => {
      const updated = { ...prev };
      stockMaster.forEach((sm) => {
        if (updated[sm.티커] === undefined) {
          const isForeign = isForeignMarket(sm.시장, sm.티커);
          updated[sm.티커] = isForeign ? 10.0 : 10000;
        }
      });
      return updated;
    });
  }, [stockMaster]);

  // 지수 카드는 실제 API 응답을 주기적으로 반영
  useEffect(() => {
    let cancelled = false;

    const fetchIndices = async () => {
      try {
        const response = await fetch("/api/indices", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const items = await response.json();
        if (cancelled || !Array.isArray(items)) {
          return;
        }

        setLiveTicks((prev) => {
          const next = { ...prev };

          items.forEach((item) => {
            if (item?.key && typeof item.value === "number") {
              next[item.key] = item.value;
            }
          });

          return next;
        });

        setIndexChangePercents((prev) => {
          const next = { ...prev };

          items.forEach((item) => {
            if (item?.key && typeof item.changePercent === "number") {
              next[item.key] = item.changePercent;
            }
          });

          return next;
        });
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (_error) {
        // Keep the previous values on transient fetch failures.
      }
    };

    fetchIndices();
    const timer = setInterval(fetchIndices, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchDailyPrices = async () => {
      try {
        await refreshDailyPrices();
        if (cancelled) {
          return;
        }
      } catch (_error) {
        // Ignore transient fetch errors and keep the last snapshot.
      }
    };

    fetchDailyPrices();
    const timer = setInterval(fetchDailyPrices, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshDailyPrices]);

  const EXCHANGE_RATE = liveTicks.exchangeRate;

  const getChangeStr = (pct) =>
    pct >= 0 ? `▲ ${pct.toFixed(2)}%` : `▼ ${Math.abs(pct).toFixed(2)}%`;

  // [전제 5 보존] 마운트 시점에 로컬 스토리지 복구
  useEffect(() => {
    let cancelled = false;

    const bootstrapState = async () => {
      const savedTx = localStorage.getItem(STORAGE_KEYS.TX);
      const savedCash = localStorage.getItem(STORAGE_KEYS.CASH);
      const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

      try {
        const response = await fetch("/api/app-state", { cache: "no-store" });

        if (response.ok) {
          const remoteState = await response.json();

          if (cancelled) {
            return;
          }

          if (Array.isArray(remoteState.transactions)) {
            setTransactions(remoteState.transactions);
          } else if (savedTx) {
            setTransactions(JSON.parse(savedTx));
          }

          if (Array.isArray(remoteState.cashFlows)) {
            setCashFlows(remoteState.cashFlows);
          } else if (savedCash) {
            setCashFlows(JSON.parse(savedCash));
          }

          if (Array.isArray(remoteState.stockMaster) && remoteState.stockMaster.length > 0) {
            setStockMaster(remoteState.stockMaster);
          } else if (savedMaster) {
            setStockMaster(JSON.parse(savedMaster));
          }

          setCashAdjustment(Number(remoteState.cashAdjustment) || 0);

          setIsLoaded(true);
          return;
        }
      } catch (_error) {
        // Fall back to local storage if remote state is unavailable.
      }

      if (cancelled) {
        return;
      }

      if (savedTx) setTransactions(JSON.parse(savedTx));
      if (savedCash) setCashFlows(JSON.parse(savedCash));
      if (savedMaster) setStockMaster(JSON.parse(savedMaster));
      setCashAdjustment(0);
      setIsLoaded(true);
    };

    bootstrapState();

    return () => {
      cancelled = true;
    };
  }, []);

  // [전제 5 보존] 상태 변경 시 안전하게 스토리지 업데이트
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashFlows));
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(stockMaster));

    fetch("/api/app-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions,
        cashFlows,
        stockMaster,
        cashAdjustment,
      }),
    }).catch(() => {
      // Keep local storage as a fallback even if remote save fails.
    });
  }, [transactions, cashFlows, stockMaster, cashAdjustment, isLoaded]);

  const formatNum = (n) => (n ? Math.round(Number(n)).toLocaleString() : "0");
  const formatFloat = (n) =>
    n
      ? Number(n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const fetchAuthMe = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const payload = await response.json();
      setAuthUser(payload?.user || null);
    } catch (_error) {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchBootstrapStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/bootstrap", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) return;
      setCanBootstrap(Boolean(payload?.canBootstrap));
      if (!payload?.canBootstrap) {
        setBootstrapMode(false);
      }
    } catch (_error) {
      // keep default
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    if (authUser?.role !== "admin") {
      setAuthUsers([]);
      return;
    }
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "사용자 목록 조회 실패");
      }
      setAuthUsers(Array.isArray(payload.users) ? payload.users : []);
    } catch (error) {
      alert(error.message || "사용자 목록 조회 실패");
    }
  }, [authUser?.role]);

  useEffect(() => {
    fetchAuthMe();
  }, [fetchAuthMe]);

  useEffect(() => {
    fetchBootstrapStatus();
  }, [fetchBootstrapStatus]);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  useEffect(() => {
    if (!authUser) return;
    const syncedDate = localStorage.getItem(DAILY_CLOSE_SYNC_KEY);
    if (syncedDate === today) return;

    let cancelled = false;
    const syncDailyClose = async () => {
      try {
        await fetch("/api/price/daily", { cache: "no-store" });
        if (cancelled) return;
        localStorage.setItem(DAILY_CLOSE_SYNC_KEY, today);
        await refreshDailyPrices();
      } catch (_error) {
        // Try again on next reload if this attempt fails.
      }
    };

    syncDailyClose();
    return () => {
      cancelled = true;
    };
  }, [authUser, refreshDailyPrices, today]);

  useEffect(() => {
    if (!authLoading && !authUser) {
      setActiveTab("관리");
    }
  }, [authLoading, authUser]);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "로그인 실패");
      }
      setLoginForm({ username: "", password: "" });
      await fetchAuthMe();
      setActiveTab("보유현황");
      alert("로그인 성공");
    } catch (error) {
      alert(error.message || "로그인 실패");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAuthUser(null);
    setAuthUsers([]);
  };

  const handleBootstrapAdmin = async () => {
    try {
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bootstrapForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "최초 관리자 생성 실패");
      }
      setBootstrapMode(false);
      await fetchBootstrapStatus();
      alert("최초 관리자 생성 완료. 로그인하세요.");
    } catch (error) {
      alert(error.message || "최초 관리자 생성 실패");
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: createUserForm.username,
          displayName: createUserForm.displayName,
          password: createUserForm.password,
          role: createUserForm.role,
          isActive: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "사용자 추가 실패");
      }
      setCreateUserForm({ username: "", displayName: "", password: "", role: "user" });
      await fetchAdminUsers();
      alert("사용자 추가 완료");
    } catch (error) {
      alert(error.message || "사용자 추가 실패");
    }
  };

  const handleUpdateUser = async (user) => {
    const displayName = prompt("이름 수정", user.display_name || "");
    if (displayName === null) return;
    const role = prompt("권한(admin/user)", user.role || "user");
    if (role === null) return;
    const activeText = prompt("활성화 여부(true/false)", user.is_active ? "true" : "false");
    if (activeText === null) return;
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          role: role === "admin" ? "admin" : "user",
          isActive: String(activeText).toLowerCase() === "true",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "사용자 수정 실패");
      }
      await fetchAdminUsers();
    } catch (error) {
      alert(error.message || "사용자 수정 실패");
    }
  };

  const handleResetPassword = async (user) => {
    const nextPassword = prompt("새 비밀번호(8자 이상)");
    if (!nextPassword) return;
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetPassword: true,
          newPassword: nextPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "비밀번호 초기화 실패");
      }
      alert("비밀번호 초기화 완료");
    } catch (error) {
      alert(error.message || "비밀번호 초기화 실패");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`${user.username} 계정을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "사용자 삭제 실패");
      }
      await fetchAdminUsers();
    } catch (error) {
      alert(error.message || "사용자 삭제 실패");
    }
  };

  // 백업 파일 입출력 핸들러 (JSON)
  const handleDownloadBackup = () => {
    const backupData = {
      transactions,
      cashFlows,
      stockMaster,
      cashAdjustment,
      exportedAt: new Date().toISOString(),
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `stock_manager_backup_${today}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.transactions || !parsed.cashFlows || !parsed.stockMaster) {
          throw new Error("필수 백업 데이터 포맷이 일치하지 않습니다.");
        }
        if (confirm("⚠️ 기존 내역을 전부 파기하고 백업본으로 복구합니까?")) {
          setTransactions(parsed.transactions);
          setCashFlows(parsed.cashFlows);
          setStockMaster(parsed.stockMaster);
          setCashAdjustment(Number(parsed.cashAdjustment) || 0);
          setErrorMessage("");
          alert("성공적으로 복구가 완료되었습니다.");
        }
      } catch (err) {
        setErrorMessage(`백업 복구 실패: ${err.message}`);
        alert(`[오류] ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 개별 탭 엑셀(CSV) 입출력 핸들러 그룹
  const handleDownloadCashCsv = () => {
    const { headers, rows } = buildCashCsvRows(cashFlows);
    downloadCsv(`입출금내역_${today}.csv`, headers, rows);
  };

  const handleUploadCashCsv = async (e) => {
    if (!isAdminUser) {
      alert("일반사용자는 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const list = parseCashFlowsCsv(text);
      if (
        list.length > 0 &&
        confirm(`총 ${list.length}건의 자본 흐름 데이터를 병합합니까?`)
      ) {
        setCashFlows((prev) => [...list, ...prev]);
      }
    } catch (err) {
      alert("입출금 파싱 에러: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadTxCsv = () => {
    const { headers, rows } = buildTransactionsCsvRows(transactions);
    downloadCsv(`매매거래내역_${today}.csv`, headers, rows);
  };

  const handleUploadTxCsv = async (e) => {
    if (!isAdminUser) {
      alert("일반사용자는 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const { transactions: list, masterTokens } = parseTransactionsCsv(
        text,
        stockMaster,
      );
      if (
        list.length > 0 &&
        confirm(`총 ${list.length}건의 거래 내역을 파일 추가 반영합니까?`)
      ) {
        if (masterTokens.length > 0) {
          setStockMaster((prev) => [...prev, ...masterTokens]);
        }
        setTransactions((prev) => [...list, ...prev]);
      }
    } catch (err) {
      alert("거래내역 로드 실패: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadMasterCsv = () => {
    const { headers, rows } = buildMasterCsvRows(stockMaster);
    downloadCsv(`종목마스터_${today}.csv`, headers, rows);
  };

  const handleUploadMasterCsv = async (e) => {
    if (!isAdminUser) {
      alert("일반사용자는 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readTextFile(file, "UTF-8");
      const tokens = parseStockMasterCsv(text, stockMaster);
      if (
        tokens.length > 0 &&
        confirm(
          `신규 종목 마스터 데이터 ${tokens.length}개를 일괄 병합합니까?`,
        )
      ) {
        setStockMaster((prev) => [...prev, ...tokens]);
      }
    } catch (err) {
      alert("마스터 파일 파싱 오류: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  // ==========================================================
  // [자산 및 수익률 실시간 연산 파이프라인 프레임워크]
  // ==========================================================
  const stats = useMemo(
    () =>
      buildPortfolioStats({
        transactions,
        cashFlows,
        exchangeRate: EXCHANGE_RATE,
        liveStockPrices: effectiveLivePrices,
        dailyPriceHistoryMap,
        stockMaster,
        today,
        cashAdjustment,
      }),
    [
      transactions,
      cashFlows,
      EXCHANGE_RATE,
      effectiveLivePrices,
      dailyPriceHistoryMap,
      stockMaster,
      today,
      cashAdjustment,
    ],
  );

  const afterMarketMetrics = useMemo(() => {
    let closeEvaluation = 0;
    let afterEvaluation = 0;

    stats.holdingList.forEach((holding) => {
      const snapshot = dailyPriceSnapshots?.[holding.티커];
      const latestDate = snapshot?.latestDate || today;
      const referenceClose =
        latestDate === today && snapshot?.previousPrice != null
          ? snapshot.previousPrice
          : snapshot?.latestPrice ?? holding.현재가;
      const qty = Number(holding.보유수량) || 0;
      const isForeign = isForeignMarket(holding.시장, holding.티커);
      const afterPriceRaw =
        afterHoursPrices[holding.티커] !== undefined
          ? Number(afterHoursPrices[holding.티커])
          : liveStockPrices[holding.티커] !== undefined
            ? Number(liveStockPrices[holding.티커])
            : Number(holding.현재가);
      const afterPrice = Number.isFinite(afterPriceRaw)
        ? afterPriceRaw
        : Number(holding.현재가);

      if (isForeign) {
        closeEvaluation += qty * Number(referenceClose) * EXCHANGE_RATE;
        afterEvaluation += qty * afterPrice * EXCHANGE_RATE;
      } else {
        closeEvaluation += qty * Number(referenceClose);
        afterEvaluation += qty * afterPrice;
      }
    });

    const closeAsset = closeEvaluation + Number(stats.cashBalance || 0);
    const afterAsset = afterEvaluation + Number(stats.cashBalance || 0);
    const closeProfitAmount = closeAsset - Number(stats.netInvestment || 0);
    const afterProfitAmount = afterAsset - Number(stats.netInvestment || 0);
    const closeProfitRate =
      Number(stats.netInvestment || 0) > 0
        ? (closeProfitAmount / Number(stats.netInvestment)) * 100
        : 0;
    const afterProfitRate =
      Number(stats.netInvestment || 0) > 0
        ? (afterProfitAmount / Number(stats.netInvestment)) * 100
        : 0;

    return {
      closeEvaluation: Math.round(closeEvaluation),
      closeAsset: Math.round(closeAsset),
      closeProfitAmount: Math.round(closeProfitAmount),
      closeProfitRate,
      afterEvaluation: Math.round(afterEvaluation),
      afterAsset: Math.round(afterAsset),
      afterProfitAmount: Math.round(afterProfitAmount),
      afterProfitRate,
      deltaAsset: Math.round(afterAsset - closeAsset),
      deltaProfitAmount: Math.round(afterProfitAmount - closeProfitAmount),
    };
  }, [stats, dailyPriceSnapshots, liveStockPrices, afterHoursPrices, today, EXCHANGE_RATE]);

  // ==========================================
  // [조회 버튼 클릭 시 실시간 작동하도록 버그 전면 해결 피벗 연산 체계]
  // ==========================================
  const pivotData = useMemo(
    () =>
      buildPivotData({
        allDates: stats.allDates,
        holdingList: stats.holdingList,
        transactions,
        stockMaster,
        liveStockPrices: effectiveLivePrices,
        dailyPriceHistoryMap,
        exchangeRate: EXCHANGE_RATE,
        appliedFilter,
        today,
      }),
    [
      stats.allDates,
      stats.holdingList,
      transactions,
      stockMaster,
      effectiveLivePrices,
      dailyPriceHistoryMap,
      EXCHANGE_RATE,
      appliedFilter,
      today,
    ],
  );

  const activeHoldingQuantities = useMemo(
    () => buildActiveHoldingQuantities(stats.holdingList),
    [stats.holdingList],
  );

  useEffect(() => {
    if (activeTab !== "입출금") {
      return;
    }
    setCashTotalInput(String(Math.round(stats.cashBalance || 0)));
  }, [stats.cashBalance, activeTab]);

  useEffect(() => {
    let cancelled = false;

    const fetchLivePrices = async () => {
      const targetStocks = stockMaster.filter(
        (stock) => (activeHoldingQuantities[stock.종목명] || 0) > 0,
      );

      if (targetStocks.length === 0) {
        return;
      }

      const settled = await Promise.allSettled(
        targetStocks.map(async (stock) => {
          const response = await fetch(
            `/api/price?code=${encodeURIComponent(stock.티커)}`,
            { cache: "no-store" },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || `Failed to fetch ${stock.티커}`);
          }

          const data = await response.json();
          return {
            ticker: stock.티커,
            price: Number(data.price),
            sourceCode: data.sourceCode || stock.티커,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      setLiveStockPrices((prev) => {
        const next = { ...prev };

        settled.forEach((result) => {
          if (result.status === "fulfilled" && Number.isFinite(result.value.price)) {
            next[result.value.ticker] = result.value.price;
          }
        });

        return next;
      });
      setLivePriceStatus(() => {
        const next = {};

        targetStocks.forEach((stock, index) => {
          const result = settled[index];

          if (
            result?.status === "fulfilled" &&
            Number.isFinite(result.value.price)
          ) {
            next[stock.티커] = {
              ok: true,
              message: `실시간 수신 (${result.value.sourceCode})`,
            };
            return;
          }

          next[stock.티커] = {
            ok: false,
            message:
              result?.status === "rejected"
                ? result.reason?.message || "실시간 수신 실패"
                : "실시간 수신 실패",
          };
        });

        return next;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    };

    fetchLivePrices();
    const timer = setInterval(fetchLivePrices, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stockMaster, activeHoldingQuantities]);

  useEffect(() => {
    let cancelled = false;

    const fetchAfterHours = async () => {
      const targetStocks = stockMaster.filter(
        (stock) => (activeHoldingQuantities[stock.종목명] || 0) > 0,
      );

      if (targetStocks.length === 0) {
        if (!cancelled) {
          setAfterHoursPrices({});
          setAfterHoursStatus({});
        }
        return;
      }

      const settled = await Promise.allSettled(
        targetStocks.map(async (stock) => {
          const response = await fetch(
            `/api/price/after?code=${encodeURIComponent(stock.티커)}`,
            { cache: "no-store" },
          );
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || `Failed to fetch after-hours for ${stock.티커}`);
          }
          return await response.json();
        }),
      );

      if (cancelled) return;

      setAfterHoursPrices((prev) => {
        const next = { ...prev };
        targetStocks.forEach((stock, index) => {
          const result = settled[index];
          if (
            result?.status === "fulfilled" &&
            Number.isFinite(Number(result.value?.afterPrice))
          ) {
            next[stock.티커] = Number(result.value.afterPrice);
          }
        });
        return next;
      });

      setAfterHoursStatus(() => {
        const next = {};
        targetStocks.forEach((stock, index) => {
          const result = settled[index];
          if (
            result?.status === "fulfilled" &&
            Number.isFinite(Number(result.value?.afterPrice))
          ) {
            next[stock.티커] = {
              ok: true,
              source: result.value?.source || "after",
            };
          } else {
            next[stock.티커] = {
              ok: false,
              source: "none",
            };
          }
        });
        return next;
      });
    };

    fetchAfterHours();
    const timer = setInterval(fetchAfterHours, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stockMaster, activeHoldingQuantities]);

  const marketIndexItems = useMemo(
    () => [
      {
        n: "KOSPI 지수",
        v: liveTicks.kospi.toLocaleString(),
        d: getChangeStr(indexChangePercents.kospi),
        up: indexChangePercents.kospi >= 0,
      },
      {
        n: "KOSDAQ 지수",
        v: liveTicks.kosdaq.toLocaleString(),
        d: getChangeStr(indexChangePercents.kosdaq),
        up: indexChangePercents.kosdaq >= 0,
      },
      {
        n: "다우존스 지수",
        v: liveTicks.dow.toLocaleString(),
        d: getChangeStr(indexChangePercents.dow),
        up: indexChangePercents.dow >= 0,
      },
      {
        n: "나스닥 종합지수",
        v: liveTicks.nasdaq.toLocaleString(),
        d: getChangeStr(indexChangePercents.nasdaq),
        up: indexChangePercents.nasdaq >= 0,
      },
      {
        n: "S&P 500 지수",
        v: liveTicks.sp500.toLocaleString(),
        d: getChangeStr(indexChangePercents.sp500),
        up: indexChangePercents.sp500 >= 0,
      },
      {
        n: "원/달러 환율",
        v: liveTicks.exchangeRate.toLocaleString() + " 원",
        d: getChangeStr(indexChangePercents.exchangeRate),
        up: indexChangePercents.exchangeRate >= 0,
      },
    ],
    [liveTicks, indexChangePercents],
  );

  // [조회] 버튼 핸들러 연결
  const handleExecuteSearch = () => {
    setAppliedFilter({ start: startDate, end: endDate });
  };

  // [CRUD 인터랙션 데이터 제어 그룹]
  const triggerEditTx = (item) => {
    if (!isAdminUser) {
      alert("일반사용자는 수정할 수 없습니다.");
      return;
    }
    setEditingId(item.id);
    setNewTx(createEditableTransaction(item));
  };

  const triggerEditMaster = (item) => {
    if (!isAdminUser) {
      alert("일반사용자는 수정할 수 없습니다.");
      return;
    }
    setMasterEditingId(item.id);
    setNewStock(createEditableStock(item));
  };

  const handleApplyManualPrice = () => {
    if (!manualPriceForm.티커 || !manualPriceForm.가격) {
      alert("종목 및 단가를 재확인하세요.");
      return;
    }
    setLiveStockPrices((prev) => applyManualPrice(prev, manualPriceForm));
    setManualPriceForm({ ...manualPriceForm, 가격: "" });
  };

  const handleCollectDailyPriceHistory = async () => {
    if (!isAdminUser) {
      alert("일반사용자는 실행할 수 없습니다.");
      return;
    }
    try {
      const response = await fetch("/api/price/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions,
          stockMaster,
          holdingList: stats.holdingList,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "종가 이력 수집에 실패했습니다.");
      }

      await refreshDailyPrices();

      const messageText = result.message ? `\n사유: ${result.message}` : "";
      const targetText =
        typeof result.targets === "number" ? `\n수집 대상 종목 수: ${result.targets}` : "";
      const skippedText =
        Array.isArray(result.skipped) && result.skipped.length > 0
          ? `\n제외 종목: ${result.skipped.map((item) => `${item.code}(${item.reason})`).join(", ")}`
          : "";

      alert(
        `종가 이력 수집 완료\n저장 건수: ${result.updated || 0}${targetText}${messageText}${skippedText}`,
      );
    } catch (error) {
      alert(error.message || "종가 이력 수집에 실패했습니다.");
    }
  };

  const saveTx = () => {
    if (!isAdminUser) {
      alert("일반사용자는 저장할 수 없습니다.");
      return;
    }
    setErrorMessage("");
    if (!newTx.종목명) {
      setErrorMessage("종목 식별 인자가 누락되었습니다.");
      return;
    }
    const payload = buildTransactionPayload({
      newTx,
      editingId,
      stockMaster,
    });
    setTransactions(upsertTransaction(transactions, editingId, payload));
    resetForms();
  };

  const saveCash = () => {
    if (!isAdminUser) {
      alert("일반사용자는 저장할 수 없습니다.");
      return;
    }
    const payload = buildCashPayload(newCash);
    if (!payload) return;
    const nextPayload = { ...payload, id: cashEditingId || payload.id };
    if (cashEditingId) {
      setCashFlows(
        cashFlows.map((item) => (item.id === cashEditingId ? nextPayload : item)),
      );
    } else {
      setCashFlows([nextPayload, ...cashFlows]);
    }
    resetForms();
  };

  const triggerEditCash = (item) => {
    if (!isAdminUser) {
      alert("일반사용자는 수정할 수 없습니다.");
      return;
    }
    setCashEditingId(item.id);
    setNewCash({
      날짜: item.날짜,
      구분: item.구분,
      금액: String(item.금액),
      메모: item.메모 || "",
    });
  };

  const applyCashTotalAdjustment = () => {
    if (!isAdminUser) {
      alert("일반사용자는 수정할 수 없습니다.");
      return;
    }
    const targetAmount = parseCleanNum(cashTotalInput);
    if (targetAmount < 0) {
      alert("현금 총액은 0 이상이어야 합니다.");
      return;
    }

    const currentAmount = Math.round(stats.cashBalance || 0);
    if (targetAmount === currentAmount) {
      alert("현재 현금 총액과 동일합니다.");
      return;
    }
    setCashAdjustment(targetAmount - Math.round(stats.baseCashBalance || 0));
    setCashEditingId(null);
    alert(`현금 총액을 ${formatNum(targetAmount)} 기준으로 반영했습니다.`);
  };

  const saveMaster = () => {
    if (!isAdminUser) {
      alert("일반사용자는 저장할 수 없습니다.");
      return;
    }
    if (!newStock.종목명) return;
    const normalizedTicker = String(newStock.티커 || "")
      .trim()
      .toUpperCase();
    const normalizedMarket = inferMarketFromTicker(normalizedTicker);
    const stockPayload = {
      ...newStock,
      티커: normalizedTicker,
      시장: normalizedTicker ? normalizedMarket : newStock.시장,
      섹터:
        newStock.섹터 && newStock.섹터.trim() !== ""
          ? newStock.섹터
          : normalizedTicker
            ? normalizedMarket === "KOSPI" || normalizedMarket === "KOSDAQ"
              ? "일반제조/서비스"
              : "해외주식"
            : "일반제조/서비스",
    };
    const result = buildStockSaveResult({
      stockMaster,
      transactions,
      newStock: stockPayload,
      masterEditingId,
    });
    setStockMaster(result.stockMaster);
    setTransactions(result.transactions);
    resetForms();
  };

  const handleStockNameChange = (name) => {
    if (!isAdminUser) {
      return;
    }
    const trimmedName = String(name || "").trim();
    const lookupPool = [...stockMaster, ...INITIAL_STOCK_MASTER];
    const matched = lookupPool.find((item) => item.종목명 === trimmedName);

    setNewStock((prev) => ({
      ...prev,
      종목명: name,
      티커: matched?.티커 || prev.티커,
      시장:
        matched?.시장 ||
        (prev.티커 ? inferMarketFromTicker(prev.티커) : prev.시장),
      섹터: matched?.섹터 || prev.섹터,
    }));
  };

  const handleStockTickerBlur = async () => {
    if (!isAdminUser) {
      return;
    }
    const normalizedTicker = String(newStock.티커 || "")
      .trim()
      .toUpperCase();
    if (!normalizedTicker) {
      return;
    }

    setNewStock((prev) => ({
      ...prev,
      티커: normalizedTicker,
      시장: inferMarketFromTicker(normalizedTicker),
    }));

    if (!/^\d{6}$/.test(normalizedTicker)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/master/search?code=${encodeURIComponent(normalizedTicker)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      if (!payload?.name) {
        return;
      }

      const matchedByName = stockMaster.find((item) => item.종목명 === payload.name);
      setNewStock((prev) => ({
        ...prev,
        종목명: payload.name,
        티커: normalizedTicker,
        시장: inferMarketFromTicker(normalizedTicker),
        섹터: matchedByName?.섹터 || prev.섹터,
      }));
    } catch (_error) {
      // Keep manual input if name auto lookup fails.
    }
  };

  const deleteItem = (id) => {
    if (!isAdminUser) {
      alert("일반사용자는 삭제할 수 없습니다.");
      return;
    }
    if (!confirm("해당 레코드를 완전히 삭제 파기하시겠습니까?")) return;
    const result = removeItemByTab({
      activeTab,
      id,
      transactions,
      cashFlows,
      stockMaster,
    });
    setTransactions(result.transactions);
    setCashFlows(result.cashFlows);
    setStockMaster(result.stockMaster);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => toggleSelectedId(prev, id));
  };

  const handleSelectAllToggle = () => {
    const targets = getSelectableTargets({
      activeTab,
      transactions,
      cashFlows,
      stockMaster,
    });
    setSelectedIds((prev) => toggleAllSelectedIds(prev, targets));
  };

  const deleteSelected = () => {
    if (!isAdminUser) {
      alert("일반사용자는 삭제할 수 없습니다.");
      return;
    }
    if (
      !confirm(`선택한 ${selectedIds.length}개의 내역을 일괄 파기 삭제합니까?`)
    )
      return;
    const result = removeSelectedByTab({
      activeTab,
      selectedIds,
      transactions,
      cashFlows,
      stockMaster,
    });
    setTransactions(result.transactions);
    setCashFlows(result.cashFlows);
    setStockMaster(result.stockMaster);
    setSelectedIds([]);
  };

  const resetForms = () => {
    if (!isAdminUser && authUser) {
      return;
    }
    setEditingId(null);
    setCashEditingId(null);
    setMasterEditingId(null);
    setNewTx(createInitialTx(today));
    setNewCash(createInitialCash(today));
    setNewStock(createInitialStock());
    setManualPriceForm(createInitialManualPriceForm());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-3 py-6 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-[14px] font-black text-slate-700">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-3 py-6 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-[560px]">
          <div className="mb-4 text-center">
            <h1 className="text-[26px] font-black text-slate-900">My Stock App V3</h1>
            <p className="text-[12px] font-bold text-slate-500 mt-1">
              로그인 후 대시보드에 접근할 수 있습니다.
            </p>
          </div>
          <AuthManagementTab
            authUser={null}
            users={[]}
            authLoading={false}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            bootstrapMode={bootstrapMode}
            setBootstrapMode={setBootstrapMode}
            bootstrapForm={bootstrapForm}
            setBootstrapForm={setBootstrapForm}
            createForm={createUserForm}
            setCreateForm={setCreateUserForm}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onBootstrap={handleBootstrapAdmin}
            onCreateUser={handleCreateUser}
            onRefreshUsers={fetchAdminUsers}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            canBootstrap={canBootstrap}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-3 py-3 sm:px-6 sm:py-6 xl:px-10 2xl:px-16 text-slate-900">
      <div className="max-w-[1480px] mx-auto">
        <AppHeader
          lastUpdate={lastUpdate}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-[12px] font-bold whitespace-pre-line">
            ⚠️ <b>[데이터 정밀 파싱 시스템 분석 메시지]</b> <br />
            {errorMessage}
          </div>
        )}

        {/* 지수 대시보드 컴포넌트 프레임 */}
        <MarketIndexGrid items={marketIndexItems} />

        {/* 자산 요약 대시보드 */}
        <AssetSummaryGrid stats={stats} formatNum={formatNum} afterMarketMetrics={afterMarketMetrics} />

        {/* 8개 탭 하우징 프레임 */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-h-[850px]">
          <TabNavigation
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (!authUser && tab !== "관리") {
                alert("로그인 후 이용 가능합니다.");
                setActiveTab("관리");
                return;
              }
              setActiveTab(tab);
              resetForms();
              setSelectedIds([]);
            }}
          />

          <div className="p-3 sm:p-8">
            {/* 탭 1. 보유현황 */}
            {activeTab === "보유현황" && (
              <HoldingsTab
                stats={stats}
                formatNum={formatNum}
                formatFloat={formatFloat}
                dailyPriceSnapshots={dailyPriceSnapshots}
                today={today}
                exchangeRate={EXCHANGE_RATE}
              />
            )}

            {/* 탭 2. 일별수익률 */}
            {activeTab === "일별수익률" && (
              <DailyReturnsTab
                dailyList={stats.dailyList}
                formatNum={formatNum}
                afterMarketMetrics={afterMarketMetrics}
              />
            )}

            {/* 탭 3. 보유종목일별 */}
            {activeTab === "보유종목일별" && (
              <PivotHistoryTab
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                handleExecuteSearch={handleExecuteSearch}
                pivotData={pivotData}
                stats={stats}
                liveStockPrices={liveStockPrices}
                formatNum={formatNum}
                formatFloat={formatFloat}
              />
            )}

            {/* 탭 4. 월별수익률 */}
            {activeTab === "월별수익률" && (
              <MonthlyReturnsTab
                monthlyList={stats.monthlyList}
                formatNum={formatNum}
                afterMarketMetrics={afterMarketMetrics}
              />
            )}

            {/* 탭 5. 입출금 */}
            {activeTab === "입출금" && (
              <CashFlowsTab
                handleDownloadCashCsv={handleDownloadCashCsv}
                tabCashCsvRef={tabCashCsvRef}
                handleUploadCashCsv={handleUploadCashCsv}
                newCash={newCash}
                setNewCash={setNewCash}
                saveCash={saveCash}
                cashEditingId={cashEditingId}
                triggerEditCash={triggerEditCash}
                cashTotalInput={cashTotalInput}
                setCashTotalInput={setCashTotalInput}
                applyCashTotalAdjustment={applyCashTotalAdjustment}
                currentCashTotal={stats.cashBalance}
                deleteSelected={deleteSelected}
                cashFlows={cashFlows}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                deleteItem={deleteItem}
                formatNum={formatNum}
              />
            )}

            {/* 탭 6. 거래관리 */}
            {activeTab === "거래관리" && (
              <TransactionsTab
                handleDownloadTxCsv={handleDownloadTxCsv}
                tabTxCsvRef={tabTxCsvRef}
                handleUploadTxCsv={handleUploadTxCsv}
                editingId={editingId}
                resetForms={resetForms}
                newTx={newTx}
                setNewTx={setNewTx}
                stockMaster={stockMaster}
                saveTx={saveTx}
                deleteSelected={deleteSelected}
                transactions={transactions}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                formatNum={formatNum}
                formatFloat={formatFloat}
                exchangeRate={EXCHANGE_RATE}
                triggerEditTx={triggerEditTx}
                deleteItem={deleteItem}
              />
            )}

            {/* 탭 7. 종목마스터 */}
            {activeTab === "종목마스터" && (
              <StockMasterTab
                handleDownloadMasterCsv={handleDownloadMasterCsv}
                tabMasterCsvRef={tabMasterCsvRef}
                handleUploadMasterCsv={handleUploadMasterCsv}
                masterEditingId={masterEditingId}
                resetForms={resetForms}
                newStock={newStock}
                setNewStock={setNewStock}
                handleStockNameChange={handleStockNameChange}
                handleStockTickerBlur={handleStockTickerBlur}
                saveMaster={saveMaster}
                deleteSelected={deleteSelected}
                stockMaster={stockMaster}
                selectedIds={selectedIds}
                handleSelectAllToggle={handleSelectAllToggle}
                toggleSelect={toggleSelect}
                triggerEditMaster={triggerEditMaster}
                deleteItem={deleteItem}
              />
            )}

            {/* 탭 8. 일별종가 */}
            {activeTab === "일별종가" && (
              <DailyPricesTab
                manualPriceForm={manualPriceForm}
                setManualPriceForm={setManualPriceForm}
                stockMaster={stockMaster}
                handleApplyManualPrice={handleApplyManualPrice}
                handleCollectDailyPriceHistory={handleCollectDailyPriceHistory}
                activeHoldingQuantities={activeHoldingQuantities}
                liveStockPrices={liveStockPrices}
                afterHoursPrices={afterHoursPrices}
                afterHoursStatus={afterHoursStatus}
                dailyPriceSnapshots={dailyPriceSnapshots}
                livePriceStatus={livePriceStatus}
                defaultStockPrices={defaultStockPrices}
                today={today}
                formatNum={formatNum}
                formatFloat={formatFloat}
                afterMarketMetrics={afterMarketMetrics}
              />
            )}

            {activeTab === "관리" && (
              <div className="space-y-4">
                {isAdminUser && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                    <h3 className="text-[14px] font-black text-slate-800 mb-3">데이터 백업/복구</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleDownloadBackup}
                        className="text-[12px] font-black bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"
                      >
                        전체 데이터 백업(JSON)
                      </button>
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="text-[12px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all"
                      >
                        전체 데이터 복구(JSON)
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUploadBackup}
                        accept=".json"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
                <AuthManagementTab
                  authUser={authUser}
                  users={authUsers}
                  authLoading={authLoading}
                  loginForm={loginForm}
                  setLoginForm={setLoginForm}
                  bootstrapMode={bootstrapMode}
                  setBootstrapMode={setBootstrapMode}
                  bootstrapForm={bootstrapForm}
                  setBootstrapForm={setBootstrapForm}
                  createForm={createUserForm}
                  setCreateForm={setCreateUserForm}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onBootstrap={handleBootstrapAdmin}
                  onCreateUser={handleCreateUser}
                  onRefreshUsers={fetchAdminUsers}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onResetPassword={handleResetPassword}
                  canBootstrap={canBootstrap}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
