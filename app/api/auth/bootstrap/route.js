import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  ensureUsersTable,
  getServerSupabase,
  hashPassword,
} from "@/lib/server-auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const displayName = String(body?.displayName || "").trim() || "관리자";
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력하세요." },
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

    const { count, error: countError } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Failed to inspect users: ${countError.message}`);
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: "이미 사용자 계정이 존재합니다." },
        { status: 409 },
      );
    }

    const { error } = await supabase.from("app_users").insert({
      id: crypto.randomUUID(),
      username,
      display_name: displayName,
      role: "admin",
      is_active: true,
      password_hash: hashPassword(password),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create bootstrap admin: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);
    const { count, error } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw new Error(`Failed to inspect users: ${error.message}`);
    }

    return NextResponse.json({
      canBootstrap: (count || 0) === 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
