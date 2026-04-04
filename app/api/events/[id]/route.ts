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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
