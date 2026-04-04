import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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

export async function GET() {
  // Events list is public (displayed on site)
  const data = readEvents();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
