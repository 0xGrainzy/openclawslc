import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EVENTS_FILE = path.join(process.cwd(), "public", "events.json");

function readEvents() {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { events: [] };
  }
}

function writeEvents(data: { events: unknown[] }) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
  const [, password] = decoded.split(":", 2);
  const expected = process.env.ADMIN_PASSWORD ?? "SLCAdmin2026!";
  return password === expected;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="OpenClaw Admin"' },
    });
  }

  const { id } = await params;
  const data = readEvents();
  const before = data.events.length;
  data.events = data.events.filter((e: { id: string }) => e.id !== id);

  if (data.events.length === before) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  writeEvents(data);
  return NextResponse.json({ success: true });
}
