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

export async function GET() {
  const data = readEvents();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="OpenClaw Admin"' },
    });
  }

  const body = await req.json();
  const { title, date, description, lumaUrl } = body;

  if (!title || !date || !lumaUrl) {
    return NextResponse.json({ error: "title, date, and lumaUrl are required" }, { status: 400 });
  }

  const data = readEvents();
  const newEvent = {
    id: Date.now().toString(),
    title,
    date,
    description: description ?? "",
    lumaUrl,
    createdAt: new Date().toISOString(),
  };
  data.events.push(newEvent);
  writeEvents(data);

  return NextResponse.json(newEvent, { status: 201 });
}
