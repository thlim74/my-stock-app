"use client";

const formatDateTime = (text) => {
  if (!text) return "-";
  const value = new Date(text);
  if (Number.isNaN(value.getTime())) return "-";
  return value.toLocaleString("ko-KR", { hour12: false });
};

export default function AuthManagementTab({
  authUser,
  users,
  authLoading,
  loginForm,
  setLoginForm,
  bootstrapMode,
  setBootstrapMode,
  bootstrapForm,
  setBootstrapForm,
  createForm,
  setCreateForm,
  onLogin,
  onLogout,
  onBootstrap,
  onCreateUser,
  onRefreshUsers,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  canBootstrap = true,
  portfolios = [],
  activePortfolioId = "default",
  onPortfolioChange,
  onCreatePortfolio,
  onUpdatePortfolioUsers,
}) {
  if (authLoading) {
    return <div className="text-[13px] font-bold text-slate-500">인증 상태 확인 중...</div>;
  }

  if (!authUser) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 max-w-[520px]">
          <h3 className="text-[14px] font-black text-slate-800 mb-3">
            {bootstrapMode ? "최초 관리자 생성" : "로그인"}
          </h3>
          <div className="grid gap-2">
            {!bootstrapMode ? (
              <>
                <input
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="아이디"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black placeholder:text-slate-400 bg-white"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="비밀번호"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black placeholder:text-slate-400 bg-white"
                />
                <button
                  onClick={onLogin}
                  className="bg-slate-900 text-white rounded-xl px-4 py-2 text-[12px] font-black"
                >
                  로그인
                </button>
                {canBootstrap && (
                  <button
                    onClick={() => setBootstrapMode(true)}
                    className="text-[12px] text-blue-600 underline text-left"
                  >
                    최초 관리자 계정 생성
                  </button>
                )}
              </>
            ) : (
              <>
                <input
                  value={bootstrapForm.username}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="관리자 아이디"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black placeholder:text-slate-400 bg-white"
                />
                <input
                  value={bootstrapForm.displayName}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="이름"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black placeholder:text-slate-400 bg-white"
                />
                <input
                  type="password"
                  value={bootstrapForm.password}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="비밀번호(8자 이상)"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black placeholder:text-slate-400 bg-white"
                />
                <button
                  onClick={onBootstrap}
                  className="bg-blue-600 text-white rounded-xl px-4 py-2 text-[12px] font-black"
                >
                  관리자 생성
                </button>
                <button
                  onClick={() => setBootstrapMode(false)}
                  className="text-[12px] text-slate-500 underline text-left"
                >
                  로그인으로 돌아가기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = authUser.role === "admin";
  const selectableUsers = Array.isArray(users) ? users.filter((user) => user.is_active) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="text-[12px] font-bold text-slate-600">
          로그인 사용자: <b>{authUser.display_name || authUser.username}</b> ({authUser.role})
        </div>
        <button
          onClick={onLogout}
          className="sm:ml-auto text-[12px] font-black bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5"
        >
          로그아웃
        </button>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 className="text-[14px] font-black text-slate-800">포트폴리오 관리</h3>
          <button
            onClick={onCreatePortfolio}
            className={`self-start sm:self-auto rounded-xl border border-blue-200 bg-white px-3 py-2 text-[12px] font-black text-blue-700 ${isAdmin ? "" : "hidden"}`}
          >
            포트폴리오 추가
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {portfolios.map((portfolio) => {
            const assignedIds = Array.isArray(portfolio.userIds) ? portfolio.userIds : [];
            return (
              <div key={portfolio.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-black text-slate-900">
                      {portfolio.name}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-500">
                      {portfolio.builtIn ? "기본 데이터" : `ID: ${portfolio.id.slice(0, 8)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => onPortfolioChange?.(portfolio.id)}
                    disabled={activePortfolioId === portfolio.id}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${
                      activePortfolioId === portfolio.id
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {activePortfolioId === portfolio.id ? "사용 중" : "선택"}
                  </button>
                </div>

                {isAdmin && !portfolio.builtIn && selectableUsers.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 text-[11px] font-black text-slate-500">
                      접근 사용자 지정
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectableUsers.map((user) => {
                        const checked = assignedIds.includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextIds = checked
                                  ? assignedIds.filter((id) => id !== user.id)
                                  : [...assignedIds, user.id];
                                onUpdatePortfolioUsers?.(portfolio.id, nextIds);
                              }}
                            />
                            {user.display_name || user.username}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isAdmin ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <h3 className="text-[14px] font-black text-slate-800 mb-3">사용자 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="아이디"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black bg-white"
              />
              <input
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder="이름"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black bg-white"
              />
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold text-black bg-white"
              />
              <div className="flex gap-2">
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold bg-white text-black"
                >
                  <option value="user">일반사용자</option>
                  <option value="admin">관리자</option>
                </select>
                <button
                  onClick={onCreateUser}
                  className="bg-blue-600 text-white rounded-xl px-3 py-2 text-[12px] font-black"
                >
                  추가
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[14px] font-black text-slate-800">사용자 목록</h3>
              <button
                onClick={onRefreshUsers}
                className="text-[11px] font-black border rounded-lg px-2 py-1"
              >
                새로고침
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-black text-slate-800">{user.display_name}</div>
                    <span className="text-[11px] font-black px-2 py-1 rounded bg-white border text-slate-600">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-slate-500">{user.username}</div>
                  <div className="mt-2 text-[12px] font-bold text-slate-500">
                    상태: {user.is_active ? "활성" : "비활성"}
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-slate-500">
                    최근 로그인: {formatDateTime(user.last_login_at)}
                  </div>
                  <div className="mt-3 flex gap-3 text-[12px] font-black">
                    <button onClick={() => onUpdateUser(user)} className="text-blue-600 underline">
                      수정
                    </button>
                    <button onClick={() => onResetPassword(user)} className="text-amber-600 underline">
                      비번재설정
                    </button>
                    <button onClick={() => onDeleteUser(user)} className="text-rose-600 underline">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {users.length === 0 && (
              <div className="mt-2 text-[12px] font-bold text-slate-400">사용자가 없습니다.</div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-[12px] font-bold text-slate-500">
          일반사용자는 계정 정보 조회만 가능합니다.
        </div>
      )}
    </div>
  );
}
