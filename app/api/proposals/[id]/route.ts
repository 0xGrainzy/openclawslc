import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = readProposals();
  const before = data.proposals.length;
  data.proposals = data.proposals.filter((p: { id: string }) => p.id !== id);

  if (data.proposals.length === before) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  writeProposals(data);
  return NextResponse.json({ success: true });
}
