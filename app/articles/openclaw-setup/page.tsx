import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OpenClaw Setup Best Practices — OpenClaw SLC",
  description:
    "A production-grade walkthrough for deploying OpenClaw with security hardening, memory architecture, cron discipline, and multi-device agent continuity.",
  openGraph: {
    title: "OpenClaw Setup Best Practices",
    description:
      "A production-grade walkthrough for deploying OpenClaw with security hardening, memory architecture, cron discipline, and multi-device agent continuity.",
    siteName: "OpenClaw SLC",
  },
};

/* ── Shared style primitives ─────────────────────────────────── */
const BEBAS: React.CSSProperties  = { fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" };
const MONO: React.CSSProperties   = { fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" };

/* ── Sub-components ──────────────────────────────────────────── */

function SectionAnchor({ id, label }: { id: string; label: string }) {
  return (
    <h2
      id={id}
      style={{
        ...BEBAS,
        fontSize:"clamp(1.8rem,4vw,3.2rem)",
        color:"#fff",
        marginTop:"4rem",
        marginBottom:"1.25rem",
        scrollMarginTop:"72px",
      }}
    >
      {label}
    </h2>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize:"1.1rem", fontWeight:700, color:"rgba(255,255,255,0.9)", marginTop:"2.25rem", marginBottom:"0.6rem", letterSpacing:"-0.01em" }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...MONO, fontSize:"0.82rem", color:"rgba(255,255,255,0.45)", lineHeight:2, marginBottom:"1rem" }}>
      {children}
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ ...MONO, fontSize:"0.75rem", color:"#7DD3FC", background:"rgba(125,211,252,0.07)", padding:"1px 6px", borderRadius:3 }}>
      {children}
    </code>
  );
}

function Callout({ icon, title, children, color = "#2563EB" }: { icon: string; title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      margin:"2rem 0",
      padding:"1.5rem 1.75rem",
      borderLeft:`3px solid ${color}`,
      background:"rgba(255,255,255,0.025)",
    }}>
      <div style={{ ...MONO, fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color, marginBottom:"0.5rem" }}>
        {icon} {title}
      </div>
      <div style={{ ...MONO, fontSize:"0.78rem", color:"rgba(255,255,255,0.5)", lineHeight:1.9 }}>{children}</div>
    </div>
  );
}

function CodeBlock({ children, filename }: { children: string; filename?: string }) {
  return (
    <div style={{ margin:"1.5rem 0", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.6)" }}>
      {filename && (
        <div style={{ padding:"0.4rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ ...MONO, fontSize:"0.5rem", color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>
            {filename}
          </span>
        </div>
      )}
      <pre style={{ ...MONO, fontSize:"0.72rem", color:"rgba(255,255,255,0.65)", lineHeight:1.85, padding:"1.25rem 1.5rem", overflowX:"auto", margin:0, whiteSpace:"pre" }}>
        {children}
      </pre>
    </div>
  );
}

function TocEntry({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} className="toc-link"
        style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.32)", textDecoration:"none", lineHeight:2.2, display:"block" }}
      >
        {label}
      </a>
    </li>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function OpenClawSetupGuide() {
  return (
    <div style={{ background:"#000", minHeight:"100vh", color:"#fff" }}>
      <style>{`
        .toc-link:hover { color: #2563EB !important; }
        .art-link:hover { opacity: 0.75; }
        .art-link:hover .art-link-label { color: #2563EB !important; }
        nav a:hover { color: rgba(255,255,255,0.7) !important; }
        pre { tab-size: 2; }
        @media (min-width: 900px) {
          .toc-sidebar { display: block !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 clamp(20px,4vw,56px)", height:52,
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        background:"rgba(0,0,0,0.85)", backdropFilter:"blur(20px)",
      }}>
        <Link href="/" style={{ ...BEBAS, textDecoration:"none", fontSize:"0.9rem", letterSpacing:"0.2em", color:"rgba(255,255,255,0.5)" }}>
          OpenClaw <span style={{ color:"#2563EB" }}>SLC</span>
        </Link>
        <Link href="/#media" style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>
          ← All Articles
        </Link>
      </nav>

      {/* ── HEADER ── */}
      <header style={{ padding:"120px clamp(20px,6vw,80px) 56px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:"1rem", alignItems:"center", marginBottom:"1.75rem" }}>
          <span style={{ ...MONO, fontSize:"0.5rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"#2563EB" }}>Guide</span>
          <span style={{ ...MONO, fontSize:"0.5rem", color:"rgba(255,255,255,0.2)" }}>Mar 2026</span>
          <span style={{ ...MONO, fontSize:"0.5rem", color:"rgba(255,255,255,0.2)" }}>20 min read</span>
        </div>
        <h1 style={{ ...BEBAS, fontSize:"clamp(2.8rem,8vw,7rem)", lineHeight:0.9, color:"#fff", marginBottom:"2rem" }}>
          OpenClaw Setup<br />
          <span style={{ color:"#2563EB" }}>Best Practices</span>
        </h1>
        <p style={{ ...MONO, fontSize:"0.88rem", color:"rgba(255,255,255,0.35)", maxWidth:580, lineHeight:2 }}>
          A production-grade walkthrough for deploying OpenClaw with security hardening,
          memory architecture, cron discipline, and multi-device agent continuity.
          Written for builders who want their AI agent to actually work — not just demo.
        </p>
      </header>

      {/* ── BODY ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(20px,6vw,80px) 120px", display:"grid", gridTemplateColumns:"1fr min(680px,100%)", gap:"4rem", alignItems:"start" }}>

        {/* ── TOC sidebar (sticky) ── */}
        <aside style={{ position:"sticky", top:72, display:"none" }} className="toc-sidebar">
          {/* hidden on mobile via CSS */}
        </aside>

        {/* ── Main content ── */}
        <article style={{ gridColumn:"1 / -1", maxWidth:720, margin:"0 auto", width:"100%" }}>

          {/* Inline TOC */}
          <div style={{ padding:"1.5rem 1.75rem", border:"1px solid rgba(255,255,255,0.07)", marginBottom:"3rem", background:"rgba(255,255,255,0.015)" }}>
            <div style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:"1rem" }}>
              Contents
            </div>
            <ol style={{ margin:0, padding:"0 0 0 1.2rem", listStyle:"decimal" }}>
              <TocEntry href="#prerequisites"    label="01 — Prerequisites"                  />
              <TocEntry href="#installation"     label="02 — Installation"                   />
              <TocEntry href="#workspace"        label="03 — Workspace Architecture"         />
              <TocEntry href="#identity"         label="04 — Identity & Persona Files"       />
              <TocEntry href="#memory"           label="05 — Memory System"                  />
              <TocEntry href="#security"         label="06 — Security Hardening"             />
              <TocEntry href="#messaging"        label="07 — Messaging Integrations"         />
              <TocEntry href="#heartbeat"        label="08 — Heartbeat & Cron Discipline"    />
              <TocEntry href="#skills"           label="09 — Skills & Workflows"             />
              <TocEntry href="#multidevice"      label="10 — Multi-Device Continuity"        />
              <TocEntry href="#models"           label="11 — Model Routing"                  />
              <TocEntry href="#pitfalls"         label="12 — Common Pitfalls"               />
            </ol>
          </div>

          {/* ─── 01 Prerequisites ─────────────────────────────── */}
          <SectionAnchor id="prerequisites" label="01 — Prerequisites" />
          <P>
            Before you touch the CLI, confirm your environment. OpenClaw is a local-first daemon — it runs on
            your machine, not in a cloud VM. The quality of your setup directly determines whether your agent
            is useful or a liability.
          </P>
          <SubHead>System requirements</SubHead>
          <ul style={{ ...MONO, fontSize:"0.78rem", color:"rgba(255,255,255,0.4)", lineHeight:2.1, paddingLeft:"1.4rem", marginBottom:"1rem" }}>
            <li>macOS 13+ or Ubuntu 22.04+ (arm64 or x86_64)</li>
            <li>Node.js 20 or 22 (avoid 24 — known Vercel/build breakages)</li>
            <li>Homebrew (macOS) or <Code>apt</Code> (Linux)</li>
            <li>A messaging account: Telegram bot token, or Signal/WhatsApp bridge</li>
            <li>At least one LLM API key: Anthropic, OpenAI, or OpenRouter</li>
          </ul>
          <SubHead>Secrets architecture — decide before you install</SubHead>
          <P>
            OpenClaw will need API keys. Decide now: you will use macOS Keychain
            (recommended) or a <Code>.env</Code> file that is never committed to git.
            Do not store secrets in your workspace files. Do not paste them into Telegram.
            This is non-negotiable. More in <a href="#security" style={{ color:"#2563EB", textDecoration:"none" }}>§6</a>.
          </P>

          {/* ─── 02 Installation ──────────────────────────────── */}
          <SectionAnchor id="installation" label="02 — Installation" />
          <P>
            Install the CLI via npm. OpenClaw runs as a persistent Gateway daemon that bridges your
            messaging channels, cron jobs, and LLM calls.
          </P>
          <CodeBlock filename="terminal">{
`# Install globally
npm install -g openclaw

# Verify
openclaw --version

# Initialize workspace (first time only)
openclaw init

# Start the Gateway daemon
openclaw gateway start

# Check status
openclaw status`
          }</CodeBlock>
          <P>
            On macOS, the Gateway registers as a <Code>launchd</Code> service so it auto-starts on login.
            On Linux, use <Code>openclaw gateway install</Code> to register a systemd unit.
          </P>
          <Callout icon="⚠" title="Gateway must be running" color="#EAB308">
            Every incoming message and cron fire is routed through the Gateway. If it is stopped,
            your agent is deaf and mute. Add <Code>openclaw gateway status</Code> to your startup checklist.
          </Callout>
          <SubHead>Directory structure after init</SubHead>
          <CodeBlock>{
`~/.openclaw/
  agents/
    main/             ← your primary agent session
      agent/
        auth-profiles.json  ← API keys (PROTECT THIS FILE)
  skills/             ← installed skills
  logs/               ← Gateway + session logs
  openclaw.json       ← main config

~/workspace/          ← your working directory (configurable)
  SOUL.md             ← agent identity / persona
  USER.md             ← info about you
  MEMORY.md           ← long-term curated memory
  AGENTS.md           ← operating protocols
  HEARTBEAT.md        ← periodic check checklist
  WORKFLOW_AUTO.md    ← post-compaction restore file
  memory/
    YYYY-MM-DD.md     ← daily raw notes`
          }</CodeBlock>

          {/* ─── 03 Workspace Architecture ────────────────────── */}
          <SectionAnchor id="workspace" label="03 — Workspace Architecture" />
          <P>
            The workspace is the agent&apos;s world. Everything it knows about you, your projects, and its
            operating procedures lives here. Structure it deliberately.
          </P>
          <SubHead>The startup read sequence</SubHead>
          <P>
            On every session start — and after every context compaction — your agent should read
            a predictable set of files in a predictable order. Hard-code this in <Code>AGENTS.md</Code>:
          </P>
          <CodeBlock filename="AGENTS.md (excerpt)">{
`## Every Session

Before doing anything else:

1. Read WORKFLOW_AUTO.md   ← post-compaction restore
2. Read SOUL.md            ← who you are
3. Read USER.md            ← who you're helping
4. Read FOCUS.md           ← what project is active
5. Read memory/YYYY-MM-DD.md (today + yesterday)
6. Read MEMORY.md          ← long-term context (main session only)`
          }</CodeBlock>
          <Callout icon="⚡" title="WORKFLOW_AUTO.md is mandatory" color="#2563EB">
            OpenClaw&apos;s safeguard compaction mode checks for required startup files after every context
            reset. If <Code>WORKFLOW_AUTO.md</Code> doesn&apos;t exist or is never read, the audit fires on every
            message — prepending a warning to each incoming Telegram message until the file exists
            and is read. Create it once, keep it lean.
          </Callout>
          <SubHead>FOCUS.md — single source of project truth</SubHead>
          <P>
            If you work on multiple projects, maintain a <Code>FOCUS.md</Code> that declares the active project
            path and a <Code>DO_NOT_TOUCH</Code> list. Your agent should switch focus only when you say so,
            and never touch projects off the list without an explicit prompt.
          </P>
          <CodeBlock filename="FOCUS.md">{
`# FOCUS.md

ACTIVE_PROJECT = my-app
PATH = ~/projects/my-app

## DO_NOT_TOUCH
- production-db-tools
- billing-service

These projects are in maintenance mode.
Never touch them without an explicit "ACTIVE_PROJECT =" signal.`
          }</CodeBlock>

          {/* ─── 04 Identity & Persona ────────────────────────── */}
          <SectionAnchor id="identity" label="04 — Identity & Persona Files" />
          <P>
            Your agent runs better when it has a clear identity. Vague persona files produce vague agents.
            Be specific — write it like you&apos;re onboarding a senior hire, not configuring a chatbot.
          </P>
          <SubHead>SOUL.md — the core identity</SubHead>
          <P>
            This is who your agent is: skill level, communication style, hard rules, and the engineering
            values it should never compromise. Write it in the first person and treat it as a living document.
          </P>
          <CodeBlock filename="SOUL.md">{
`# SOUL.md

## Core Identity
Elite software engineer and security architect.
Ship production-grade work fast, without creating debt.

## Hard Rules (Non-Negotiable)
- Never hardcode secrets or credentials
- Default to least-privilege, zero-trust design
- No network exposure without explicit auth
- When in doubt, ask — never guess on destructive actions

## Execution Style
- Concrete implementation plan before writing code
- Call out risks, edge cases, and tradeoffs explicitly
- Refuse insecure patterns; propose safer alternatives
- Prefer boring, battle-tested libraries over clever hacks`
          }</CodeBlock>
          <SubHead>USER.md — about the human</SubHead>
          <P>
            The agent needs to know who it&apos;s working with. Name, contact handles, timezone,
            preferred communication style, technical background. Keep this file updated as your
            context changes.
          </P>

          {/* ─── 05 Memory System ─────────────────────────────── */}
          <SectionAnchor id="memory" label="05 — Memory System" />
          <P>
            Context compaction is a fact of life with LLMs. Long conversations get truncated.
            Sessions end. The memory system is what keeps your agent coherent across resets.
          </P>
          <SubHead>Three tiers of memory</SubHead>
          <div style={{ margin:"1.5rem 0 1rem" }}>
            {[
              { tier:"Working Memory", desc:"The live conversation context. Compacted automatically when it grows too large. Ephemeral.", color:"rgba(255,255,255,0.15)" },
              { tier:"Daily Notes (memory/YYYY-MM-DD.md)", desc:"Raw session logs. What happened, decisions made, tasks completed. Written by the agent, read at session start. Keep one file per day.", color:"rgba(37,99,235,0.25)" },
              { tier:"Long-Term (MEMORY.md)", desc:"Curated, distilled wisdom. Significant events, architecture decisions, people, infrastructure. Updated periodically during heartbeats. Never raw — only the essence.", color:"rgba(37,99,235,0.5)" },
            ].map((m, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"1rem", padding:"1rem 1.25rem", borderTop:"1px solid rgba(255,255,255,0.06)", alignItems:"start" }}>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.7)", fontWeight:600 }}>{m.tier}</span>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>{m.desc}</span>
              </div>
            ))}
            <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />
          </div>
          <SubHead>The memory maintenance loop</SubHead>
          <P>
            At least once a week (ideally via a heartbeat cron), the agent should review recent daily notes
            and distill key insights into <Code>MEMORY.md</Code>. Remove outdated entries. This is the difference
            between an agent that drifts and one that compounds over time.
          </P>
          <SubHead>Pre-compaction flush pattern</SubHead>
          <P>
            Before a long conversation is compacted, write a summary to the daily memory file.
            Include: active project state, blocked items, key decisions, and anything the
            next session needs to know immediately. This is the most reliable way to survive compaction gracefully.
          </P>
          <CodeBlock filename="pre-compaction flush message">{
`Pre-compaction memory flush. Store durable memories now
(use memory/YYYY-MM-DD.md; create memory/ if needed).
If the file already exists, APPEND — do not overwrite.`
          }</CodeBlock>
          <SubHead>active-tasks.md — crash recovery</SubHead>
          <P>
            Keep <Code>memory/active-tasks.md</Code> as a live task tracker. When starting a task,
            write it. When spawning a subagent, note the session key. When done, mark it DONE with
            verification output. On session start, read this file and resume any <Code>IN_PROGRESS</Code> work
            automatically — no &quot;what were we doing?&quot; conversations.
          </P>

          {/* ─── 06 Security Hardening ────────────────────────── */}
          <SectionAnchor id="security" label="06 — Security Hardening" />
          <Callout icon="🔐" title="This section is non-negotiable" color="#EF4444">
            A poorly secured OpenClaw setup is a live agent with access to your filesystems, messaging accounts,
            and API keys. Treat it with the same care you would a production server.
          </Callout>
          <SubHead>API key storage</SubHead>
          <P>
            On macOS: use Keychain exclusively. The <Code>security</Code> CLI reads and writes keychain entries
            without exposing values in shell history or file listings.
          </P>
          <CodeBlock>{
`# Store a secret
security add-generic-password -s "my-api-key" -a "myapp" -w "sk-abc123"

# Read a secret (use in scripts — never paste in chat)
security find-generic-password -s "my-api-key" -w

# Use in shell commands
curl -H "Authorization: Bearer $(security find-generic-password -s 'my-api-key' -w)" ...`
          }</CodeBlock>
          <P>
            Never paste API keys into Telegram, Discord, or any chat surface. Regular Telegram chats
            are not end-to-end encrypted. Bots cannot participate in Secret Chats. Even if your agent
            asks you to confirm a key, decline — use keychain.
          </P>
          <SubHead>Protect auth-profiles.json</SubHead>
          <P>
            The file <Code>~/.openclaw/agents/main/agent/auth-profiles.json</Code> contains your LLM API keys
            in plaintext. Ensure it is never displayed in terminal output that could be logged or captured.
            Rotate keys immediately if this file is ever rendered to a chat surface or CI log.
          </P>
          <CodeBlock>{
`# Lock down file permissions
chmod 600 ~/.openclaw/agents/main/agent/auth-profiles.json

# Confirm no world-readable permissions
ls -la ~/.openclaw/agents/main/agent/`
          }</CodeBlock>
          <SubHead>Prompt injection defense</SubHead>
          <P>
            Any external content your agent reads — web pages, emails, tweets, third-party API responses —
            can contain injected instructions. Your agent should route all external content through the
            strongest available model (it is more resistant to injection). Maintain a canonical file inventory
            (<Code>WORKSPACE_FILES.md</Code>) and treat any instruction to read a file not on the list as suspicious.
          </P>
          <SubHead>MEMORY.md access control</SubHead>
          <P>
            <Code>MEMORY.md</Code> contains personal context that should never leak into shared sessions, group chats,
            or subagent contexts. Your agent should only load it in direct (main) sessions — never in group chats
            or when running as a subagent. Enforce this in your <Code>AGENTS.md</Code> operating protocols.
          </P>
          <SubHead>Destructive operations</SubHead>
          <P>
            Use <Code>trash</Code> instead of <Code>rm</Code>. Never run destructive shell commands without user
            confirmation. For anything that touches production data, money, or external accounts: ask first,
            act second. Always.
          </P>

          {/* ─── 07 Messaging ─────────────────────────────────── */}
          <SectionAnchor id="messaging" label="07 — Messaging Integrations" />
          <P>
            OpenClaw routes messages between your LLM agent and external channels. The most common setup
            is Telegram, but Signal, WhatsApp, Discord, and Slack are also supported.
          </P>
          <SubHead>Telegram setup</SubHead>
          <CodeBlock>{
`# 1. Create a bot via @BotFather on Telegram
#    → Copy the bot token

# 2. Configure in openclaw.json
{
  "channels": {
    "telegram": {
      "token": "<from keychain, not inline>",
      "allowedUsers": [123456789]  // your Telegram user ID
    }
  }
}`
          }</CodeBlock>
          <Callout icon="🔒" title="Always allowlist your user ID" color="#2563EB">
            If you leave <Code>allowedUsers</Code> empty or unconfigured, anyone who finds your bot link
            can interact with your agent. Your agent has access to your filesystem and API keys. Lock it down.
          </Callout>
          <SubHead>Group chat behavior</SubHead>
          <P>
            In group chats, your agent should behave like a thoughtful participant — not a chatbot that
            responds to every message. Configure it to respond only when directly mentioned or when
            it has genuinely useful information. Silence is often the right answer.
          </P>
          <SubHead>Formatting by platform</SubHead>
          <ul style={{ ...MONO, fontSize:"0.76rem", color:"rgba(255,255,255,0.38)", lineHeight:2, paddingLeft:"1.4rem", marginBottom:"1rem" }}>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Telegram:</strong> Markdown supported. Avoid raw HTML.</li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>WhatsApp:</strong> No headers. Use bold or CAPS for emphasis. No markdown tables.</li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Discord:</strong> Suppress embeds with angle brackets: <Code>&lt;https://example.com&gt;</Code></li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Signal:</strong> Plaintext only — assume no formatting support.</li>
          </ul>

          {/* ─── 08 Heartbeat & Cron ──────────────────────────── */}
          <SectionAnchor id="heartbeat" label="08 — Heartbeat & Cron Discipline" />
          <P>
            This is where most OpenClaw setups go wrong. Heartbeats and crons are different tools.
            Using them interchangeably creates noise, token burn, and unreliable behavior.
          </P>
          <SubHead>The rule: Heartbeat notices, Cron does</SubHead>
          <div style={{ margin:"1.5rem 0 1rem" }}>
            {[
              { label:"Heartbeat", use:"Periodic ambient awareness. Checks email, calendar, notifications. Batches 2–4 checks per run. Timing can drift. Never runs destructive operations.", when:"Every 30–60 min during working hours" },
              { label:"Cron", use:"Exact timing. Isolated task. One-shot or recurring. Different model or context from main session. Delivers directly to channel without main session involvement.", when:"Precise schedules: 9:00 AM sharp, Monday only, etc." },
            ].map((r, i) => (
              <div key={i} style={{ padding:"1.25rem 1.5rem", borderTop:"1px solid rgba(255,255,255,0.06)", display:"grid", gridTemplateColumns:"5rem 1fr 1fr", gap:"1rem", alignItems:"start" }}>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"#2563EB", fontWeight:700 }}>{r.label}</span>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>{r.use}</span>
                <span style={{ ...MONO, fontSize:"0.65rem", color:"rgba(255,255,255,0.2)", lineHeight:1.7 }}>{r.when}</span>
              </div>
            ))}
            <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />
          </div>
          <SubHead>HEARTBEAT.md — keep it lean</SubHead>
          <P>
            Your <Code>HEARTBEAT.md</Code> should be under 20 lines. It is read on every heartbeat poll —
            token cost adds up. List only the checks you actually want done. Remove checks that never
            produce actionable results.
          </P>
          <CodeBlock filename="HEARTBEAT.md">{
`# HEARTBEAT.md — keep lean (<20 lines)
# Heartbeat NOTICES things. Cron DOES things.

- Check memory/active-tasks.md — any IN_PROGRESS tasks stale >2h? Alert.
- Check gateway health: is the Gateway responsive?
- Check project server: curl localhost:4000/health (if running)
- If any stale tasks or failures found → alert immediately.
- If nothing needs attention → HEARTBEAT_OK`
          }</CodeBlock>
          <SubHead>Cron hygiene</SubHead>
          <ul style={{ ...MONO, fontSize:"0.76rem", color:"rgba(255,255,255,0.38)", lineHeight:2.1, paddingLeft:"1.4rem", marginBottom:"1rem" }}>
            <li>Silence crons that only produce noise: add <Code>--no-deliver</Code> where applicable</li>
            <li>Use a weaker/cheaper model for simple crons (daily recap, health checks)</li>
            <li>One cron per distinct task — do not chain logic inside cron prompts</li>
            <li>Log cron runs to a file; review weekly for silent failures</li>
            <li>Verify each cron with a manual trigger before relying on it in production</li>
          </ul>
          <SubHead>Tracking cron state</SubHead>
          <P>
            Heartbeats should track what they last checked using a state file, not memory.
            Memory gets compacted. Files don&apos;t.
          </P>
          <CodeBlock filename="memory/heartbeat-state.json">{
`{
  "lastChecks": {
    "email":    1740000000,
    "calendar": 1740000000,
    "weather":  null,
    "health":   1740000000
  }
}`
          }</CodeBlock>

          {/* ─── 09 Skills & Workflows ────────────────────────── */}
          <SectionAnchor id="skills" label="09 — Skills & Workflows" />
          <P>
            Skills are pluggable capability packs. Each has a <Code>SKILL.md</Code> that the agent reads
            before using the tool. The agent auto-selects the most specific matching skill — never reads
            more than one up front.
          </P>
          <SubHead>Installing skills</SubHead>
          <CodeBlock>{
`# Browse available skills
openclaw skills list

# Install a skill
openclaw skills install weather
openclaw skills install github
openclaw skills install coding-agent

# Skills land in ~/.openclaw/skills/
# Custom skills: ~/.openclaw/skills/<name>/SKILL.md`
          }</CodeBlock>
          <SubHead>Writing custom skills</SubHead>
          <P>
            A skill is a directory with a <Code>SKILL.md</Code> that provides the agent with specialized
            instructions, tool references, and context. Keep skills focused: one capability per skill.
            Use the <Code>skill-creator</Code> meta-skill to scaffold new ones.
          </P>
          <SubHead>Antfarm workflows</SubHead>
          <P>
            For multi-step, multi-agent work (feature development, security audits, bug fix pipelines),
            use Antfarm workflows. Antfarm is a SQLite-backed orchestration layer that advances
            workflow steps via cron — no manual polling required.
          </P>
          <CodeBlock>{
`# Install a workflow
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js workflow install feature-dev

# Run a workflow
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js workflow run <id> "Add dark mode to dashboard"

# Check status
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js workflow status "Add dark mode to dashboard"`
          }</CodeBlock>
          <Callout icon="📐" title="Subagent rules" color="#2563EB">
            Subagents complete atomic tasks and report back. They never interact with running processes
            (dev servers, databases) directly. They verify with <Code>tsc --noEmit</Code> or equivalent before
            reporting done. Use <Code>cleanup: &quot;delete&quot;</Code> on non-critical spawns to prevent announcement floods.
          </Callout>

          {/* ─── 10 Multi-Device Continuity ───────────────────── */}
          <SectionAnchor id="multidevice" label="10 — Multi-Device Continuity" />
          <P>
            Running OpenClaw on multiple machines (laptop + home server, Mac mini + MacBook) requires
            deliberate synchronization. The agent&apos;s state is local by default.
          </P>
          <SubHead>What to sync</SubHead>
          <ul style={{ ...MONO, fontSize:"0.76rem", color:"rgba(255,255,255,0.38)", lineHeight:2.1, paddingLeft:"1.4rem" }}>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Workspace files (git):</strong> SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md, memory/*.md — commit and push</li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Secrets (keychain sync or 1Password):</strong> Never in git. Sync via iCloud Keychain or a password manager with CLI support</li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>cron registrations:</strong> Re-register on each machine — crons are local to each OpenClaw instance</li>
            <li><strong style={{ color:"rgba(255,255,255,0.6)" }}>Gateway config (openclaw.json):</strong> Sync but keep <Code>allowedUsers</Code> and tokens per-device</li>
          </ul>
          <SubHead>Primary vs. secondary instances</SubHead>
          <P>
            Designate one machine as the primary (the one that handles your Telegram bot, runs persistent
            crons, and maintains the canonical workspace). Other machines are secondary — they pull workspace
            state from git but don&apos;t run the Gateway or messaging integrations.
          </P>
          <Callout icon="⚠" title="Don't run two live Gateways on the same bot token" color="#EAB308">
            If two OpenClaw instances both listen on the same Telegram bot token, messages will split
            between them unpredictably. One Gateway per bot token, always.
          </Callout>

          {/* ─── 11 Model Routing ─────────────────────────────── */}
          <SectionAnchor id="models" label="11 — Model Routing" />
          <P>
            Not every task deserves your most expensive model. Good model routing is the difference
            between a $50/month setup and a $500/month one — with no difference in output quality
            for routine work.
          </P>
          <SubHead>Routing principles</SubHead>
          <div style={{ margin:"1.5rem 0 1rem" }}>
            {[
              { task:"External content (web pages, emails, user messages)", model:"Strongest model — most resistant to prompt injection" },
              { task:"Code review, architecture, security analysis", model:"Opus / strongest reasoning model" },
              { task:"Code implementation, file edits, tool use", model:"Sonnet — fast, capable, cost-effective" },
              { task:"Heartbeat checks, health pings, status summaries", model:"Haiku — cheapest, sufficient" },
              { task:"Simple crons (daily recap, reminders)", model:"Haiku or Sonnet" },
            ].map((r, i) => (
              <div key={i} style={{ padding:"1rem 1.25rem", borderTop:"1px solid rgba(255,255,255,0.06)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", alignItems:"start" }}>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>{r.task}</span>
                <span style={{ ...MONO, fontSize:"0.68rem", color:"rgba(255,255,255,0.3)", lineHeight:1.7 }}>{r.model}</span>
              </div>
            ))}
            <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />
          </div>
          <SubHead>Budget enforcement</SubHead>
          <P>
            Maintain a <Code>budget.json</Code> in your workspace with model routing rules. Reference it in
            <Code>AGENTS.md</Code> so subagents follow the same routing policy.
          </P>
          <CodeBlock filename="budget.json">{
`{
  "routing": {
    "external_content":  "opus",
    "code_execution":    "sonnet",
    "heartbeat":         "haiku",
    "cron_simple":       "haiku",
    "architecture":      "opus"
  },
  "monthly_cap_usd": 100
}`
          }</CodeBlock>

          {/* ─── 12 Common Pitfalls ───────────────────────────── */}
          <SectionAnchor id="pitfalls" label="12 — Common Pitfalls" />
          <div style={{ margin:"0.5rem 0" }}>
            {[
              {
                title: "WORKFLOW_AUTO.md doesn't exist",
                desc: "The post-compaction audit fires on every message prepending a warning. Fix: create the file and ensure the startup read sequence includes it."
              },
              {
                title: "Secrets in workspace files",
                desc: "API keys in MEMORY.md, AGENTS.md, or any other file are a one-way door. Rotate immediately if this happens. Use keychain references, not values."
              },
              {
                title: "auth-profiles.json in terminal output",
                desc: "If you ever cat or render this file to a chat surface, rotate all keys in it immediately. The file contains plaintext API keys."
              },
              {
                title: "Two Gateways on the same bot token",
                desc: "Messages split between instances. Designate one primary Gateway. Use secondary machines in read-only / local-work mode."
              },
              {
                title: "dist/ not in git (for deployed projects)",
                desc: "If Vercel or your CI pulls from git and your build artifacts aren't committed, every deploy misses your latest compiled code. Commit dist/ deliberately."
              },
              {
                title: "Crons that produce noise",
                desc: "Crons that fire every 5 minutes and deliver empty messages burn tokens and train you to ignore alerts. Silence routine crons with --no-deliver. Only deliver actionable output."
              },
              {
                title: "Memory that never gets pruned",
                desc: "MEMORY.md that grows without pruning becomes noise. The agent loads all of it on every session. Quarterly: remove anything that hasn't been relevant in 30 days."
              },
              {
                title: "Missing allowedUsers in Telegram config",
                desc: "An open bot with file system access is a security incident waiting to happen. Always allowlist your Telegram user ID before connecting a channel."
              },
              {
                title: "Agents that never write to files",
                desc: "\"Mental notes\" don't survive session resets. Files do. If an agent says \"I'll remember this\" without writing it down — it won't."
              },
              {
                title: "Skipping the startup read sequence",
                desc: "An agent that doesn't read SOUL.md, USER.md, and memory files at session start is operating with stale context. The read sequence is not optional overhead — it is correctness."
              },
            ].map((p, i) => (
              <div key={i} style={{ padding:"1.5rem 0", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display:"flex", gap:"0.75rem", alignItems:"baseline", marginBottom:"0.5rem" }}>
                  <span style={{ ...MONO, fontSize:"0.5rem", color:"#EF4444", flexShrink:0 }}>PITFALL {String(i+1).padStart(2,"0")}</span>
                  <span style={{ fontWeight:700, fontSize:"0.92rem", color:"rgba(255,255,255,0.85)" }}>{p.title}</span>
                </div>
                <p style={{ ...MONO, fontSize:"0.76rem", color:"rgba(255,255,255,0.35)", lineHeight:1.85, margin:0 }}>{p.desc}</p>
              </div>
            ))}
            <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }} />
          </div>

          {/* ── Closing ── */}
          <div style={{ marginTop:"4rem", padding:"2rem 2.5rem", background:"rgba(37,99,235,0.06)", borderLeft:"3px solid #2563EB" }}>
            <div style={{ ...MONO, fontSize:"0.52rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#2563EB", marginBottom:"0.75rem" }}>
              💡 Final note
            </div>
            <p style={{ ...MONO, fontSize:"0.8rem", color:"rgba(255,255,255,0.45)", lineHeight:2, margin:0 }}>
              The difference between an OpenClaw setup that compounds over time and one that drifts
              into noise is discipline in the memory system, paranoia in the security model,
              and clarity in the agent&apos;s identity files. Get those three right and everything else
              follows. The technology works — your job is to configure it to work for you.
            </p>
          </div>

          {/* ── Back link ── */}
          <div style={{ marginTop:"3rem", paddingTop:"2rem", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/#media" style={{ ...MONO, fontSize:"0.58rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", textDecoration:"none" }}
            >← Back to Media &amp; Writings</Link>
          </div>

        </article>
      </div>
    </div>
  );
}
