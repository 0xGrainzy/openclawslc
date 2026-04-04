import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { rotateAdminKey } from "@/lib/admin-key";

export async function POST(req: NextRequest) {
  void req;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newKey = await rotateAdminKey();
  return NextResponse.json({
    ok: true,
    newKey,
    message:
      "Key rotated. Copy it now — it will NOT be shown again.",
  });
}
