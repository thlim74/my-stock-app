import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  ensureUsersTable,
  getServerSupabase,
  hashPassword,
  requireAdmin,
} from "@/lib/server-auth";
import { loadAuthSecurityRegistry } from "@/lib/server-auth-security";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);

    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, display_name, role, is_active, last_login_at, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load users: ${error.message}`);
    }
    const securityRegistry = await loadAuthSecurityRegistry(supabase);
    const users = (data || []).map((user) => {
      const security = securityRegistry.find(
        (record) => record.userId === user.id || record.username === user.username,
      );
      return {
        ...user,
        authSecurity: security || {
          failedCount: 0,
          locked: false,
          lockedAt: null,
          lastFailedAt: null,
        },
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    const status = error.message?.includes("권한") || error.message?.includes("로그인") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const displayName = String(body?.displayName || "").trim();
    const role = body?.role === "admin" ? "admin" : "user";
    const password = String(body?.password || "");
    const isActive = body?.isActive !== false;

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: "아이디/이름/비밀번호를 모두 입력하세요." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);
    const { error } = await supabase.from("app_users").insert({
      id: crypto.randomUUID(),
      username,
      display_name: displayName,
      role,
      is_active: isActive,
      password_hash: hashPassword(password),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.message?.includes("duplicate key")) {
        return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 409 });
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message?.includes("권한") || error.message?.includes("로그인") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
