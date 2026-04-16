import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { rateLimit } from "@/lib/rate-limit";

const PROPOSALS_FILE = path.join(process.cwd(), "public", "proposals.json");

function readProposals() {
  try {
    const raw = fs.readFileSync(PROPOSALS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { proposals: [] };
  }
}

function writeProposals(data: { proposals: unknown[] }) {
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readProposals());
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 submissions per hour per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = rateLimit(`proposal:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many proposals. Try again later." },
      { status: 429 }
    );
  }

  let body: { title?: string; description?: string; proposedDate?: string; contact?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const proposedDate = body.proposedDate?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";

  if (!title || !contact) {
    return NextResponse.json(
      { error: "title and contact are required" },
      { status: 400 }
    );
  }

  // Soft length caps to keep the JSON file sane
  if (title.length > 160 || description.length > 2000 || contact.length > 200) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  const data = readProposals();
  const newProposal = {
    id: Date.now().toString(),
    title,
    description,
    proposedDate,
    contact,
    createdAt: new Date().toISOString(),
  };
  data.proposals.push(newProposal);
  writeProposals(data);

  return NextResponse.json({ success: true }, { status: 201 });
}
