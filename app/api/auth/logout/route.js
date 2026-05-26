import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server-auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
