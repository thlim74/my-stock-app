import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: '코드가 없습니다.' }, { status: 400 });

  try {
    const res = await fetch(`https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    const data = await res.json();
    const name = data?.result?.areas?.[0]?.datas?.[0]?.nm;

    if (!name) return NextResponse.json({ error: '종목을 찾을 수 없습니다.' }, { status: 404 });

    return NextResponse.json({ name });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

#### 2. 메인 페이지 통합 코드 (`app/page.js`)
기존 대시보드 구조에 **종목마스터 탭의 실제 동작 로직**을 추가한 전체 파일입니다.

```javascript
'use client';
import { useState, useEffect } from 'react';

export default function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState('종목마스터'); // 현재 작업 중인 탭
  const [indices, setIndices] = useState([]);
  
  // 종목마스터 관련 상태
  const [masterList, setMasterList] = useState([
    { ticker: '005930', name: '삼성전자', currency: 'KRW' },
    { ticker: '000660', name: 'SK하이닉스', currency: 'KRW' }
  ]);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState('KRW');
  const [isSearching, setIsSearching] = useState(false);

  // 티커 자동 찾기 함수
  const handleAutoFind = async () => {
    if (!newTicker) return alert('티커를 입력하세요.');
    setIsSearching(true);
    try {
      const res = await fetch(`/api/master/search?code=${newTicker}`);
      const data = await res.json();
      if (data.name) setNewName(data.name);
      else alert('종목을 찾을 수 없습니다.');
    } catch (e) {
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 종목 추가 함수
  const handleAddMaster = () => {
    if (!newTicker || !newName) return alert('정보를 모두 입력하세요.');
    setMasterList([...masterList, { ticker: newTicker, name: newName, currency: newCurrency }]);
    setNewTicker(''); setNewName('');
  };

  const menuItems = ['보유현황', '일별수익률', '보유종목일별', '월별수익률', '입출금', '거래관리', '종목마스터', '일별종가'];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
      {/* ... 헤더 및 지수 섹션 생략 ... */}

      <div className="rounded-[2.5rem] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-50 bg-slate-50/50 p-2 overflow-x-auto scrollbar-hide">
          {menuItems.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-[11px] font-black transition-all ${activeTab === tab ? 'bg-slate-800 text-white rounded-2xl shadow-lg transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === '종목마스터' && (
            <div className="animate-in fade-in duration-500">
              {/* 입력 섹션 */}
              <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl items-end">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Ticker</label>
                  <input value={newTicker} onChange={(e) => setNewTicker(e.target.value)} placeholder="예: 005930" className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200 focus:ring-slate-800" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Asset Name</label>
                  <div className="flex gap-2">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="종목명" className="flex-1 bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200" />
                    <button onClick={handleAutoFind} disabled={isSearching} className="bg-slate-200 px-4 rounded-xl text-[10px] font-black hover:bg-slate-300 transition-all">
                      {isSearching ? '검색중' : '티커 자동찾기'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Currency</label>
                  <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="w-full bg-white border-none p-3 rounded-xl text-xs font-bold outline-none ring-1 ring-slate-200">
                    <option value="KRW">KRW</option><option value="USD">USD</option>
                  </select>
                </div>
                <button onClick={handleAddMaster} className="bg-slate-800 text-white rounded-xl font-black text-xs py-3.5 shadow-lg hover:bg-black transition-all">종목 추가</button>
              </div>

              {/* 리스트 테이블 */}
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-tighter">
                    <th className="pb-4 px-4">Ticker</th><th className="pb-4">Asset Name</th><th className="pb-4 text-center">Currency</th><th className="pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterList.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-500 uppercase tracking-widest">{item.ticker}</td>
                      <td className="py-4 font-black text-slate-800">{item.name}</td>
                      <td className="py-4 text-center font-bold text-slate-400 text-[10px]">{item.currency}</td>
                      <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold hover:bg-blue-100">수정</button>
                          <button className="px-3 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold hover:bg-rose-100" onClick={() => setMasterList(masterList.filter((_, idx) => idx !== i))}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
