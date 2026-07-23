import { NextResponse } from "next/server";
import {
  ensureUsersTable,
  getServerSupabase,
  hashPassword,
  requireAdmin,
} from "@/lib/server-auth";
import { clearAuthSecurityForUser } from "@/lib/server-auth-security";

const getRouteId = async (params) => {
  const resolved = await params;
  return String(resolved?.id || "").trim();
};

const adminErrorStatus = (error) => {
  const message = String(error?.message || "");
  return message.includes("권한") || message.includes("로그인") ? 403 : 500;
};

const findTargetUser = async (supabase, { id, username }) => {
  if (id) {
    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, role")
      .eq("id", id)
      .maybeSingle();
    if (data || error) return { data, error };
  }

  if (username) {
    return supabase
      .from("app_users")
      .select("id, username, role")
      .eq("username", username)
      .maybeSingle();
  }

  return { data: null, error: null };
};

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const id = await getRouteId(params);
    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();

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

    const { data: target, error: targetError } = await findTargetUser(supabase, {
      id,
      username,
    });

    if (targetError || !target) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (admin.id === target.id && payload.is_active === false) {
      return NextResponse.json({ error: "본인 계정은 비활성화할 수 없습니다." }, { status: 400 });
    }
    if (admin.id === target.id && payload.role === "user") {
      return NextResponse.json({ error: "본인 계정 권한은 변경할 수 없습니다." }, { status: 400 });
    }

    const { error } = await supabase.from("app_users").update(payload).eq("id", target.id);
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (body?.unlockAuth || body?.resetPassword) {
      await clearAuthSecurityForUser(supabase, {
        username: target.username,
        userId: target.id,
        unlockedBy: admin.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: adminErrorStatus(error) });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const id = await getRouteId(params);
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim().toLowerCase();

    const supabase = getServerSupabase();
    await ensureUsersTable(supabase);

    const { data: target, error: targetError } = await findTargetUser(supabase, {
      id,
      username,
    });

    if (targetError || !target) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (admin.id === target.id) {
      return NextResponse.json({ error: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
    }

    const { error } = await supabase.from("app_users").delete().eq("id", target.id);
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    await clearAuthSecurityForUser(supabase, {
      username: target.username,
      userId: target.id,
      unlockedBy: admin.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: adminErrorStatus(error) });
  }
}
