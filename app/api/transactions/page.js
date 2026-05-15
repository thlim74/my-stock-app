"use client";
import { useState } from "react";

export default function TransactionPage() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* 1. 거래 입력 섹션 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-slate-800 rounded-full"></span>
          거래 입력
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <input type="date" className="border p-2 rounded-lg text-sm" />
          <select className="border p-2 rounded-lg text-sm">
            <option>매수</option>
            <option>매도</option>
          </select>
          <input
            type="text"
            placeholder="종목명"
            className="border p-2 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="종목코드"
            className="border p-2 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="수량"
            className="border p-2 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="단가"
            className="border p-2 rounded-lg text-sm"
          />
          <button className="bg-slate-800 text-white rounded-lg font-bold py-2 hover:bg-slate-700 transition-all">
            저장하기
          </button>
        </div>
      </div>

      {/* 2. 거래 내역 섹션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold">거래 내역</h2>
          <div className="flex gap-2">
            <button className="text-xs bg-slate-100 px-3 py-1 rounded-md font-medium">
              전체삭제
            </button>
            <button className="text-xs bg-slate-800 text-white px-3 py-1 rounded-md font-medium">
              엑셀다운
            </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">날짜</th>
              <th className="px-6 py-3">구분</th>
              <th className="px-6 py-3">종목</th>
              <th className="px-6 py-3 text-right">수량</th>
              <th className="px-6 py-3 text-right">단가</th>
              <th className="px-6 py-3 text-right">정산금액</th>
              <th className="px-6 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="text-xs hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-slate-500">2024-05-14</td>
              <td className="px-6 py-4">
                <span className="text-rose-500 font-bold">매수</span>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800">삼성전자</td>
              <td className="px-6 py-4 text-right">10</td>
              <td className="px-6 py-4 text-right">72,000</td>
              <td className="px-6 py-4 text-right font-bold">720,000</td>
              <td className="px-6 py-4 text-center">
                <button className="text-slate-300 hover:text-rose-500 text-lg">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
