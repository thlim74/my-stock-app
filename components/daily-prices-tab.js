"use client";

import { useEffect, useMemo, useState } from "react";
import { isForeignMarket } from "@/lib/market-utils";

export default function DailyPricesTab({
  manualPriceForm,
  setManualPriceForm,
  stockMaster,
  handleApplyManualPrice,
  handleCollectDailyPriceHistory,
  activeHoldingQuantities,
  liveStockPrices,
  dailyPriceSnapshots,
  livePriceStatus,
  today,
  formatNum,
  formatFloat,
}) {
  const [searchTicker, setSearchTicker] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [detailTicker, setDetailTicker] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const sortedStocks = useMemo(() => {
    return [...stockMaster]
      .filter((stock) => {
        const keyword = searchTicker.trim().toUpperCase();
        if (!keyword) return true;

        return (
          String(stock.티커 || "").toUpperCase().includes(keyword) ||
          String(stock.종목명 || "").toUpperCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const qtyA = activeHoldingQuantities[a.종목명] || 0;
        const qtyB = activeHoldingQuantities[b.종목명] || 0;

        if ((qtyA > 0) !== (qtyB > 0)) {
          return qtyB > 0 ? 1 : -1;
        }

        if (qtyA !== qtyB) {
          return qtyB - qtyA;
        }

        const dateA = dailyPriceSnapshots[a.티커]?.latestDate || "";
        const dateB = dailyPriceSnapshots[b.티커]?.latestDate || "";

        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }

        return a.종목명.localeCompare(b.종목명, "ko");
      });
  }, [activeHoldingQuantities, dailyPriceSnapshots, searchTicker, stockMaster]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!detailTicker && !searchDate) {
        setHistoryRows([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (detailTicker) params.set("code", detailTicker);
        if (searchDate) params.set("date", searchDate);

        const response = await fetch(`/api/daily-prices?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("종가 상세 이력을 불러오지 못했습니다.");
        }

        const rows = await response.json();
        setHistoryRows(Array.isArray(rows) ? rows : []);
      } catch (_error) {
        setHistoryRows([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [detailTicker, searchDate]);

  const detailTitle = detailTicker
    ? stockMaster.find((stock) => stock.티커 === detailTicker)?.종목명 || detailTicker
    : searchDate
      ? `${searchDate} 종가 검색 결과`
      : "종가 상세 이력";

  return (
    <div>
      <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <button
          onClick={handleCollectDailyPriceHistory}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-slate-700 transition-all"
        >
          최초 매수일 이후 종가 수집
        </button>
        <div className="space-y-1 sm:ml-auto">
          <select
            value={manualPriceForm.티커}
            onChange={(e) =>
              setManualPriceForm({
                ...manualPriceForm,
                티커: e.target.value,
              })
            }
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold bg-white"
          >
            <option value="">--종목 선택--</option>
            {stockMaster.map((stock) => (
              <option key={stock.id} value={stock.티커}>
                {stock.종목명} ({stock.티커})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <input
            type="number"
            placeholder="현재가 입력"
            value={manualPriceForm.가격}
            onChange={(e) =>
              setManualPriceForm({
                ...manualPriceForm,
                가격: e.target.value,
              })
            }
            className="border rounded-xl px-3 py-1.5 text-[12px] font-bold"
          />
        </div>
        <button
          onClick={handleApplyManualPrice}
          className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[12px] font-black shadow hover:bg-amber-700 transition-all"
        >
          현재가 반영
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500">종목 검색</label>
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value)}
              placeholder="종목명 또는 티커"
              className="w-full border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500">특정일 검색</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
            />
          </div>
          <button
            onClick={() => {
              setSearchTicker("");
              setSearchDate("");
              setDetailTicker("");
              setHistoryRows([]);
            }}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[12px] font-black hover:bg-slate-100 transition-all"
          >
            검색 초기화
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-500">
        종목 행을 클릭하면 실제 일자별 종가 이력을 아래에서 확인할 수 있습니다.
      </div>

      <div className="data-table-wrap">
        <table className="data-table min-w-[1180px] text-center">
          <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
            <tr>
              <th>기준일</th>
              <th>티커</th>
              <th>종목명</th>
              <th>시장구분</th>
              <th>보유수량</th>
              <th>전일종가</th>
              <th>최초 수집일</th>
              <th>수집건수</th>
              <th>실시간 현재가</th>
              <th>종가 대비 변동</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold">
            {sortedStocks.map((stock, index) => {
              const isForeign = isForeignMarket(stock.시장, stock.티커);
              const snapshot = dailyPriceSnapshots[stock.티커];
              const priceStatus = livePriceStatus[stock.티커];
              const isTodaySnapshot = snapshot?.latestDate === today;
              const referenceClose =
                isTodaySnapshot && snapshot?.previousPrice != null
                  ? snapshot.previousPrice
                  : snapshot?.latestPrice ?? null;
              const currentPrice =
                liveStockPrices[stock.티커] !== undefined
                  ? liveStockPrices[stock.티커]
                  : referenceClose ?? null;
              const holdingQty = activeHoldingQuantities[stock.종목명] || 0;
              const diff =
                currentPrice !== null && referenceClose !== null
                  ? currentPrice - referenceClose
                  : null;
              const pct =
                diff !== null && referenceClose
                  ? ((diff / referenceClose) * 100).toFixed(2)
                  : null;

              return (
                <tr
                  key={index}
                  onClick={() => setDetailTicker(stock.티커)}
                  className={`h-11 border-b cursor-pointer hover:bg-slate-50 ${
                    detailTicker === stock.티커 ? "bg-amber-50" : holdingQty > 0 ? "bg-blue-50/50" : ""
                  }`}
                >
                  <td>{snapshot?.latestDate || today}</td>
                  <td className="text-blue-600 font-black">{stock.티커}</td>
                  <td className="font-black text-slate-800">{stock.종목명}</td>
                  <td>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">
                      {stock.시장}
                    </span>
                  </td>
                  <td
                    className={
                      holdingQty > 0
                        ? "font-black text-blue-600 bg-blue-100/30"
                        : "text-slate-400 font-normal"
                    }
                  >
                    {formatNum(holdingQty)}
                  </td>
                  <td className="font-mono text-slate-900">
                    {referenceClose === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(referenceClose)}`
                        : formatNum(referenceClose)}
                  </td>
                  <td className="text-slate-600">{snapshot?.oldestDate || "-"}</td>
                  <td className="text-slate-700">{snapshot?.rowCount || 0}</td>
                  <td className="font-mono font-black text-slate-900">
                    {currentPrice === null
                      ? "-"
                      : isForeign
                        ? `$ ${formatFloat(currentPrice)}`
                        : formatNum(currentPrice)}
                    {priceStatus && (
                      <div
                        className={`mt-1 text-[10px] font-bold ${
                          priceStatus.ok ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {priceStatus.message}
                      </div>
                    )}
                  </td>
                  <td>
                    {pct === null ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <span
                        className={`text-[11px] font-black ${
                          diff >= 0 ? "text-rose-500" : "text-blue-500"
                        }`}
                      >
                        {diff >= 0 ? `+${pct}%` : `-${Math.abs(Number(pct)).toFixed(2)}%`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="text-[14px] font-black text-slate-800">{detailTitle}</h3>
          <div className="text-[11px] font-bold text-slate-400">
            {detailTicker
              ? "현재 선택한 종목의 일자별 종가 이력"
              : searchDate
                ? "선택한 날짜 기준 종가 검색 결과"
                : "종목을 클릭하거나 날짜를 지정하세요."}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table min-w-[680px] text-center">
            <thead className="bg-slate-800 text-white text-[11px] font-black uppercase">
              <tr>
                <th>날짜</th>
                <th>티커</th>
                <th>종목명</th>
                <th>시장</th>
                <th>종가</th>
              </tr>
            </thead>
            <tbody className="text-[12px] font-bold">
              {historyLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-400">
                    조회 중...
                  </td>
                </tr>
              ) : historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-400">
                    표시할 종가 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                historyRows.map((row, index) => {
                  const matched = stockMaster.find((stock) => stock.티커 === row.code);
                  const market = matched?.시장 || "";
                  const isForeign = isForeignMarket(market, row.code);

                  return (
                    <tr key={`${row.code}-${row.date}-${index}`} className="h-10 border-b hover:bg-slate-50">
                      <td>{row.date}</td>
                      <td className="text-blue-600 font-black">{row.code}</td>
                      <td className="font-black text-slate-800">{matched?.종목명 || "-"}</td>
                      <td className="text-slate-500">{market || "-"}</td>
                      <td className="font-mono text-slate-900">
                        {isForeign ? `$ ${formatFloat(row.price)}` : formatNum(row.price)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
