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
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="비밀번호"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold"
                />
                <button
                  onClick={onLogin}
                  className="bg-slate-900 text-white rounded-xl px-4 py-2 text-[12px] font-black"
                >
                  로그인
                </button>
                <button
                  onClick={() => setBootstrapMode(true)}
                  className="text-[12px] text-blue-600 underline text-left"
                >
                  최초 관리자 계정 생성
                </button>
              </>
            ) : (
              <>
                <input
                  value={bootstrapForm.username}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="관리자 아이디"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold"
                />
                <input
                  value={bootstrapForm.displayName}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="이름"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold"
                />
                <input
                  type="password"
                  value={bootstrapForm.password}
                  onChange={(e) =>
                    setBootstrapForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="비밀번호(8자 이상)"
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold"
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

      {isAdmin ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <h3 className="text-[14px] font-black text-slate-800 mb-3">사용자 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="아이디"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold"
              />
              <input
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder="이름"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold"
              />
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호"
                className="border rounded-xl px-3 py-2 text-[12px] font-bold"
              />
              <div className="flex gap-2">
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="border rounded-xl px-3 py-2 text-[12px] font-bold bg-white"
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

          <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[14px] font-black text-slate-800">사용자 목록</h3>
              <button
                onClick={onRefreshUsers}
                className="text-[11px] font-black border rounded-lg px-2 py-1"
              >
                새로고침
              </button>
            </div>
            <div className="data-table-wrap">
              <table className="data-table min-w-[960px] text-center">
                <thead className="bg-slate-800 text-white text-[11px] font-black">
                  <tr>
                    <th>아이디</th>
                    <th>이름</th>
                    <th>권한</th>
                    <th>활성</th>
                    <th>최근 로그인</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-bold">
                  {users.map((user) => (
                    <tr key={user.id} className="h-11 border-b">
                      <td>{user.username}</td>
                      <td>{user.display_name}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? "활성" : "비활성"}</td>
                      <td>{formatDateTime(user.last_login_at)}</td>
                      <td className="space-x-2">
                        <button
                          onClick={() => onUpdateUser(user)}
                          className="text-[11px] text-blue-600 underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => onResetPassword(user)}
                          className="text-[11px] text-amber-600 underline"
                        >
                          비번재설정
                        </button>
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="text-[11px] text-rose-600 underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-slate-400">
                        사용자 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
