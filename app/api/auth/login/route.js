import { NextResponse } from "next/server";
import {
  buildSessionToken,
  ensureUsersTable,
  getServerSupabase,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server-auth";

export async function POST(request) {
  try {
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

    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, display_name, role, is_active, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다. 관리자에게 문의하세요." },
        { status: 403 },
      );
    }

    if (!verifyPassword(password, data.password_hash)) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const token = buildSessionToken({
      id: data.id,
      username: data.username,
      role: data.role,
    });
    await setSessionCookie(token);

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
