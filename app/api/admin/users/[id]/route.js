import { NextResponse } from "next/server";
import {
  ensureUsersTable,
  getServerSupabase,
  hashPassword,
  requireAdmin,
} from "@/lib/server-auth";

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    const body = await request.json();

    const payload = {
      updated_at: new Date().toISOString(),
    };
    if (body?.displayName !== undefined) {
      payload.display_name = String(body.displayName || "").trim();
    }
    if (body?.role !== undefined) {
      payload.role = body.role === "admin" ? "admin" : "user";
    }
    if (body?.isActive !== undefined) {
      payload.is_active = Boolean(body.isActive);
    }
    if (body?.resetPassword) {
      const nextPassword = String(body.newPassword || "");
      if (nextPassword.length < 8) {
        return NextResponse.json(
          { error: "초기화 비밀번호는 8자 이상이어야 합니다." },
          { status: 400 },
        );
      }
      payload.password_hash = hashPassword(nextPassword);
    }

    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);

    const { data: target, error: targetError } = await supabase
      .from("app_users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (admin.id === id && payload.is_active === false) {
      return NextResponse.json({ error: "본인 계정은 비활성화할 수 없습니다." }, { status: 400 });
    }
    if (admin.id === id && payload.role === "user") {
      return NextResponse.json({ error: "본인 계정 권한은 변경할 수 없습니다." }, { status: 400 });
    }

    const { error } = await supabase.from("app_users").update(payload).eq("id", id);
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message?.includes("권한") || error.message?.includes("로그인") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    if (admin.id === id) {
      return NextResponse.json({ error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
    }

    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);
    const { error } = await supabase.from("app_users").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message?.includes("권한") || error.message?.includes("로그인") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
