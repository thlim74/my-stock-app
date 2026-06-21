import { NextResponse } from "next/server";
import {
  buildSessionToken,
  ensureUsersTable,
  getServerSupabase,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server-auth";
import {
  AUTH_LOCK_THRESHOLD,
  clearAuthSecurityForUser,
  findAuthSecurityRecord,
  loadAuthSecurityRegistry,
  recordFailedLogin,
  shouldBlockForeignIp,
} from "@/lib/server-auth-security";

const invalidLoginResponse = () =>
  NextResponse.json(
    { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 },
  );

export async function POST(request) {
  try {
    if (shouldBlockForeignIp(request)) {
      return NextResponse.json(
        { error: "해외 IP 접속은 차단되었습니다." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력하세요." },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);

    const securityRegistry = await loadAuthSecurityRegistry(supabase);
    const securityRecord = findAuthSecurityRecord(securityRegistry, username);
    if (securityRecord?.locked) {
      return NextResponse.json(
        { error: "패스워드 오류 5회로 계정이 차단되었습니다. 관리자에게 해제를 요청하세요." },
        { status: 423 },
      );
    }

    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, display_name, role, is_active, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !data) {
      await recordFailedLogin(supabase, { username });
      return invalidLoginResponse();
    }

    if (!data.is_active) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다. 관리자에게 문의하세요." },
        { status: 403 },
      );
    }

    if (!verifyPassword(password, data.password_hash)) {
      const failed = await recordFailedLogin(supabase, {
        username,
        userId: data.id,
      });
      if (failed?.locked) {
        return NextResponse.json(
          { error: `패스워드 오류 ${AUTH_LOCK_THRESHOLD}회로 계정이 차단되었습니다.` },
          { status: 423 },
        );
      }
      return invalidLoginResponse();
    }

    const token = buildSessionToken({
      id: data.id,
      username: data.username,
      role: data.role,
    });
    await setSessionCookie(token);
    await clearAuthSecurityForUser(supabase, {
      username,
      userId: data.id,
    });

    await supabase
      .from("app_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.id);

    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        role: data.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
