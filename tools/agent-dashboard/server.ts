/**
 * Agent Dashboard Server
 * Serves the dashboard UI and provides SSE updates + tmux send-keys integration.
 *
 * Adapted from Eesti-Raudtee/dev-toolkit for zuga.ee
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import * as url from "node:url";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { exec, execFile, execSync } from "node:child_process";
import { promisify } from "node:util";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const execAsync = promisify(exec);
// execFileAsync avoids shell injection: args are passed directly, not via sh -c
const execFileAsync = promisify(execFile);

// Load credentials from ~/.claude/.env if present
const ENV_FILE = path.join(process.env.HOME ?? "/home/michelek", ".claude", ".env");
try {
  const envContent = fs.readFileSync(ENV_FILE, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* optional */ }

const PORT = Number(process.env.PORT ?? 4242);
const TEAM_NAME = process.env.CLAUDE_TEAM_NAME ?? "zuga-builders";
const HOME = process.env.HOME ?? "/home/michelek";
const GITHUB_REPOS = (process.env.GITHUB_REPOS ?? "mitselek/zuga.ee").split(",").map((r) => r.trim());
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

const REPO_DIR = path.join(HOME, "Documents", "github", "zuga.ee");
const TEAM_DIR = path.join(HOME, ".claude", "teams", TEAM_NAME);
const TASKS_DIR = path.join(HOME, ".claude", "tasks", TEAM_NAME);
const CONFIG_PATH = path.join(TEAM_DIR, "config.json");
const INBOXES_DIR = path.join(TEAM_DIR, "inboxes");
const CONVERSATIONS_DIR = path.join(HOME, ".claude", "projects", "-home-michelek-Documents-github-zuga-ee");
const ROSTER_PATH = path.join(REPO_DIR, ".claude", "teams", TEAM_NAME, "roster.json");
const PROMPTS_DIR = path.join(REPO_DIR, ".claude", "teams", TEAM_NAME, "prompts");
const MEMORY_DIR = path.join(REPO_DIR, ".claude", "teams", TEAM_NAME, "memory");

const INDEX_PATH = path.join(__dirname, "index.html");

// ── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  name: string;
  agentType: string;
  tmuxPaneId: string;
  color?: string;
  isActive?: boolean;
  backendType?: string | null;
  model?: string;
}

interface TeamConfig {
  name: string;
  members: TeamMember[];
  leadSessionId?: string;
}

interface InboxMessage {
  from: string;
  text: string;
  summary?: string;
  timestamp: string;
  color?: string;
  read?: boolean;
}

interface DashboardDoc {
  id: string;
  title: string;
  content: string;
  from: string;
  addedAt: string;
}

// Raw shape read from task JSON files on disk
interface RawTask {
  id: string;
  subject: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "deleted";
  owner: string | null;
  activeForm?: string;
  blocks?: string[];
  blockedBy?: string[];
}

// Raw shapes from gh CLI output
interface GhPr {
  number: number;
  title: string;
  author: { login: string };
  headRefName: string;
  isDraft: boolean;
  createdAt: string;
}

interface GhIssue {
  number: number;
  title: string;
  author: { login: string };
  labels: { name: string; color: string }[];
  createdAt: string;
}

// SSE snapshot shapes (sent to browser)
interface GitHubPR {
  number: number;
  title: string;
  author: string;
  branch: string;
  isDraft: boolean;
  createdAt: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  author: string;
  labels: { name: string; color: string }[];
  createdAt: string;
}

interface GitHubRepoData {
  repoFull: string;  // e.g. "mitselek/zuga.ee"
  prs: GitHubPR[];
  issues: GitHubIssue[];
}

// Shapes returned by gh issue view / gh pr view (on-demand fetch)
interface GhIssueView {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  labels: { name: string; color: string }[];
  createdAt: string;
  assignees: { login: string }[];
  comments: { author: { login: string }; body: string; createdAt: string }[];
}

interface GhPrView {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  headRefName: string;
  baseRefName: string;
  isDraft: boolean;
  state: string;
  assignees: { login: string }[];
  reviews: { author: { login: string }; state: string; body: string }[];
  comments: { author: { login: string }; body: string; createdAt: string }[];
}

interface Agent {
  name: string;
  isActive: boolean;
  color: string | null;
  paneId: string;
  agentType: string;
  model: string | null;
  contextPct: number | null;
  lastActivity: string | null;
  agentStatus: "thinking" | "working" | "idle";
  prompt: string | null;
}

interface Message {
  from: string;
  to: string;
  text: string;
  summary: string;
  timestamp: string;
  color: string;
}

interface Task {
  id: string;
  subject: string;
  description: string;
  status: string;
  owner: string | null;
  activeForm?: string;
  blocks: string[];
  blockedBy: string[];
}

interface HealthData {
  git: { branch: string; clean: boolean; ahead: number; behind: number } | null;
  ci: { repo: string; status: string; conclusion: string | null; name: string; updatedAt: string }[];
  cd: never[];
  agentStats: { total: number; active: number; idle: number; avgContextPct: number | null };
  system: { memUsedMb: number; memTotalMb: number; swapUsedMb: number; swapTotalMb: number; cpuPct: number; uptimeMin: number; gpu: { name: string; vramUsedMb: number; vramTotalMb: number; tempC: number; gpuPct: number } | null };
}

interface SSESnapshot {
  agents: Agent[];
  messages: Message[];
  tasks: Task[];
  github: Record<string, GitHubRepoData>;
  health: HealthData;
  commonPrompt: string | null;
  claudeMd: string | null;
  memoryMd: string | null;
  agentScratchpads: Record<string, string | null>;
  docs: DashboardDoc[];
}

// ── In-memory Docs Store ─────────────────────────────────────────────────────

const dashboardDocs: DashboardDoc[] = [];

// ── Data Helpers ─────────────────────────────────────────────────────────────

function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function getTmuxPanes(): Promise<Set<string>> {
  try {
    const { stdout } = await execAsync("tmux list-panes -a -F '#{pane_id}'");
    const panes = new Set<string>();
    for (const line of stdout.trim().split("\n")) {
      const id = line.trim();
      if (id) panes.add(id);
    }
    return panes;
  } catch {
    return new Set();
  }
}

interface RosterMember {
  name: string;
  agentType: string;
  color?: string;
  model?: string;
  prompt?: string;
}

function loadRoster(): RosterMember[] {
  try {
    const roster = JSON.parse(fs.readFileSync(ROSTER_PATH, "utf-8"));
    return (roster.members ?? []).filter((m: RosterMember) => m.name);
  } catch { return []; }
}

function loadAgents(config: TeamConfig, activePanes: Set<string>): Omit<Agent, "contextPct" | "lastActivity" | "agentStatus">[] {
  const rosterMembers = loadRoster();
  const rosterByName = new Map(rosterMembers.map((m) => [m.name, m]));

  // Spawned agents from config
  const spawned = new Set<string>();
  const agents: Omit<Agent, "contextPct" | "lastActivity" | "agentStatus">[] = config.members.map((m) => {
    spawned.add(m.name);
    const roster = rosterByName.get(m.name);
    return {
      name: m.name,
      isActive: m.backendType === "tmux"
        ? activePanes.has(m.tmuxPaneId)
        : (m.isActive ?? false),
      color: m.color ?? roster?.color ?? "gray",
      paneId: m.tmuxPaneId ?? "",
      agentType: m.agentType,
      model: m.model ?? roster?.model ?? null,
      prompt: readPromptFor(m.name),
    };
  });

  // Unspawned agents from roster
  for (const rm of rosterMembers) {
    if (spawned.has(rm.name)) continue;
    agents.push({
      name: rm.name,
      isActive: false,
      color: rm.color ?? "gray",
      paneId: "",
      agentType: rm.agentType,
      model: rm.model ?? null,
      prompt: readPromptFor(rm.name),
    });
  }

  return agents;
}

function readFileOr(filePath: string): string | null {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return null; }
}

// Loads agent prompt: tries team-internal prompts/ first, then shared ~/.claude/teams/prompts/
const SHARED_PROMPTS_DIR = path.join(HOME, ".claude", "teams", "prompts");
function readPromptFor(agentName: string): string | null {
  return readFileOr(path.join(PROMPTS_DIR, `${agentName}.md`))
    ?? readFileOr(path.join(SHARED_PROMPTS_DIR, `${agentName}.md`));
}

// Parse context % from tmux capture-pane output.
// Claude Code's status line format: "… · ████░░░░ 56% · $22.00"
// We look for the last occurrence of a 1-3 digit number followed by %.
async function captureContextPct(paneId: string): Promise<number | null> {
  let targetPane = paneId;
  // team-lead has no tmuxPaneId — fall back to the current tmux pane
  if (!targetPane) {
    try {
      const { stdout } = await execFileAsync("tmux", ["display-message", "-p", "#{pane_id}"]);
      targetPane = stdout.trim();
    } catch {
      return null;
    }
  }
  if (!targetPane) return null;
  try {
    const { stdout } = await execFileAsync("tmux", ["capture-pane", "-t", targetPane, "-p"]);
    const matches = [...stdout.matchAll(/\b(\d{1,3})%/g)];
    if (matches.length === 0) return null;
    const pct = parseInt(matches[matches.length - 1][1], 10);
    return pct >= 0 && pct <= 100 ? pct : null;
  } catch {
    return null;
  }
}

interface AgentActivity {
  lastActivity: string | null;
  status: "thinking" | "working" | "idle";
}

function summarizeToolUse(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Edit":
    case "Read":
    case "Write": {
      const fp = String(input.file_path ?? "");
      const parts = fp.split("/").filter(Boolean);
      return `${name}: ${parts.slice(-2).join("/")}`;
    }
    case "Bash": {
      const cmd = String(input.command ?? "").trim().slice(0, 50);
      return `Bash: ${cmd}`;
    }
    case "Grep":
      return `Grep: ${String(input.pattern ?? "").slice(0, 40)}`;
    case "Glob":
      return `Glob: ${String(input.pattern ?? "").slice(0, 40)}`;
    case "Agent":
      return `Agent: ${String(input.description ?? "").slice(0, 40)}`;
    default:
      return name;
  }
}

function loadAllAgentActivities(): Map<string, AgentActivity> {
  const result = new Map<string, AgentActivity>();
  try {
    // Determine team-lead's JSONL file from leadSessionId in config
    let leadJSONLPath: string | null = null;
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as TeamConfig;
      if (cfg.leadSessionId) {
        const candidate = path.join(CONVERSATIONS_DIR, `${cfg.leadSessionId}.jsonl`);
        if (fs.existsSync(candidate)) leadJSONLPath = candidate;
      }
    } catch { /* config unreadable — proceed without team-lead tracking */ }

    const files = fs.readdirSync(CONVERSATIONS_DIR)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => {
        const fp = path.join(CONVERSATIONS_DIR, f);
        return { fp, mtime: fs.statSync(fp).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length === 0) return result;

    const READ_TAIL = 100 * 1024;
    const topFiles = files.slice(0, 3);

    // Track latest entry per agent across all files (highest timestamp wins)
    const latestByAgent = new Map<string, {
      activity: string; timestamp: string | null; type: "tool_use" | "text";
    }>();

    for (const { fp } of topFiles) {
      const isLeadFile = leadJSONLPath !== null && fp === leadJSONLPath;

      const size = fs.statSync(fp).size;
      const offset = Math.max(0, size - READ_TAIL);

      const fd = fs.openSync(fp, "r");
      const buf = Buffer.alloc(size - offset);
      try {
        fs.readSync(fd, buf, 0, size - offset, offset);
      } finally {
        fs.closeSync(fd);
      }

      const text = buf.toString("utf8");
      // Skip first line (may be truncated) if we started mid-file
      const rawLines = text.split("\n");
      const lines = offset > 0 ? rawLines.slice(1) : rawLines;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line) as Record<string, unknown>;
          const agentName = entry.agentName;

          // Determine which agent this entry belongs to
          let resolvedName: string;
          if (typeof agentName === "string" && agentName) {
            resolvedName = agentName;
          } else if (isLeadFile) {
            // Team-lead's own JSONL has no agentName — treat as "team-lead"
            resolvedName = "team-lead";
          } else {
            continue;
          }

          const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : null;
          const msg = entry.message as Record<string, unknown> | undefined;
          const content = Array.isArray(msg?.content) ? (msg!.content as Record<string, unknown>[]) : null;
          if (!content) continue;

          const existing = latestByAgent.get(resolvedName);
          const existingTs = existing?.timestamp ?? null;
          // Only update if this entry is newer (or we have no entry yet)
          if (existingTs && timestamp && timestamp <= existingTs) continue;

          for (const item of content) {
            if (item.type === "tool_use") {
              const activity = summarizeToolUse(
                String(item.name ?? ""),
                (item.input as Record<string, unknown>) ?? {}
              );
              latestByAgent.set(resolvedName, { activity, timestamp, type: "tool_use" });
            } else if (item.type === "text" && entry.role === "assistant") {
              latestByAgent.set(resolvedName, { activity: "Thinking…", timestamp, type: "text" });
            }
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    const now = Date.now();
    for (const [agentName, { activity, timestamp, type }] of latestByAgent) {
      let status: "thinking" | "working" | "idle" = "idle";
      if (timestamp) {
        const age = now - new Date(timestamp).getTime();
        if (age < 15000) {
          status = type === "tool_use" ? "working" : "thinking";
        }
      }
      result.set(agentName, { lastActivity: activity, status });
    }
  } catch {
    // ignore — dashboard is best-effort
  }
  return result;
}

function loadMessages(): Message[] {
  const all: Message[] = [];

  let inboxFiles: string[] = [];
  try {
    inboxFiles = fs.readdirSync(INBOXES_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  for (const file of inboxFiles) {
    const to = file.replace(".json", "");
    const msgs = readJsonFile<InboxMessage[]>(path.join(INBOXES_DIR, file));
    if (!Array.isArray(msgs)) continue;

    for (const m of msgs) {
      // Filter idle_notifications
      if (m.text && m.text.startsWith('{"type":"idle_notification"')) continue;
      const from = m.from ?? "unknown";
      all.push({
        from: from === to ? "PO" : from,
        to,
        text: m.text ?? "",
        summary: m.summary ?? "",
        timestamp: m.timestamp ?? "",
        color: from === to ? "cyan" : (m.color ?? "gray"),
      });
    }
  }

  // Sort newest first, keep last 50
  all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return all.slice(0, 50);
}

function loadTasks(): Task[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(TASKS_DIR).filter((f) => /^\d+\.json$/.test(f));
  } catch {
    return [];
  }

  const tasks: Task[] = [];
  for (const file of files) {
    const task = readJsonFile<RawTask>(path.join(TASKS_DIR, file));
    if (!task || task.status === "deleted") continue;
    tasks.push({
      id: task.id,
      subject: task.subject,
      description: task.description ?? "",
      status: task.status,
      owner: task.owner ?? null,
      activeForm: task.activeForm,
      blocks: task.blocks ?? [],
      blockedBy: task.blockedBy ?? [],
    });
  }

  // Sort by numeric ID ascending
  tasks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  return tasks;
}

// ── GitHub ────────────────────────────────────────────────────────────────────

const githubCache: Record<string, GitHubRepoData> = {};

async function fetchRepoData(repo: string): Promise<GitHubRepoData> {
  // Y-2: use execFile so repo is passed as a literal arg, never interpolated into a shell string
  const [prOut, issueOut] = await Promise.all([
    execFileAsync("gh", [
      "pr", "list", "--repo", repo, "--state", "open",
      "--json", "number,title,author,headRefName,isDraft,createdAt", "--limit", "20",
    ]).then((r) => r.stdout),
    execFileAsync("gh", [
      "issue", "list", "--repo", repo, "--state", "open",
      "--json", "number,title,author,labels,createdAt", "--limit", "30",
    ]).then((r) => r.stdout),
  ]);

  const rawPrs: GhPr[] = JSON.parse(prOut);
  const rawIssues: GhIssue[] = JSON.parse(issueOut);

  return {
    repoFull: repo,
    prs: rawPrs.map((p) => ({
      number: p.number,
      title: p.title,
      author: p.author?.login ?? "unknown",
      branch: p.headRefName ?? "",
      isDraft: p.isDraft ?? false,
      createdAt: p.createdAt,
    })),
    issues: rawIssues.map((i) => ({
      number: i.number,
      title: i.title,
      author: i.author?.login ?? "unknown",
      labels: (i.labels ?? []).map((l) => ({ name: l.name, color: l.color })),
      createdAt: i.createdAt,
    })),
  };
}

async function fetchGitHub(): Promise<void> {
  const results = await Promise.allSettled(GITHUB_REPOS.map(fetchRepoData));
  for (let i = 0; i < GITHUB_REPOS.length; i++) {
    // Y-3: guard against malformed entries (e.g. "bad-entry" without a slash)
    const parts = GITHUB_REPOS[i].split("/");
    if (parts.length < 2 || !parts[1]) {
      console.error(`Malformed GITHUB_REPOS entry (expected "owner/repo"): ${GITHUB_REPOS[i]}`);
      continue;
    }
    const repoKey = parts[1]; // "zuga.ee" from "mitselek/zuga.ee"
    const result = results[i];
    if (result.status === "fulfilled") {
      githubCache[repoKey] = result.value;
    } else {
      console.error(`GitHub fetch error for ${GITHUB_REPOS[i]}:`, result.reason);
      // Keep stale cache entry on error
      if (!githubCache[repoKey]) {
        githubCache[repoKey] = { repoFull: GITHUB_REPOS[i], prs: [], issues: [] };
      }
    }
  }
}

// Fetch immediately on start, then every 30s
fetchGitHub();
setInterval(fetchGitHub, 30_000);

// ── Health Data ──────────────────────────────────────────────────────────────

async function getGitHealth(): Promise<HealthData["git"]> {
  try {
    const cwd = REPO_DIR;
    const [branchRes, statusRes, revRes] = await Promise.all([
      execAsync("git rev-parse --abbrev-ref HEAD", { cwd }),
      execAsync("git status --porcelain", { cwd }),
      execAsync("git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo '0\t0'", { cwd }),
    ]);
    const branch = branchRes.stdout.trim();
    const clean = statusRes.stdout.trim() === "";
    const [ahead, behind] = revRes.stdout.trim().split(/\s+/).map(Number);
    return { branch, clean, ahead: ahead || 0, behind: behind || 0 };
  } catch {
    return null;
  }
}

async function getCIHealth(): Promise<HealthData["ci"]> {
  if (!GITHUB_TOKEN) return [];
  const results: HealthData["ci"] = [];
  try {
    for (const repo of GITHUB_REPOS) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/runs?per_page=1&status=completed`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { workflow_runs?: { name: string; status: string; conclusion: string; updated_at: string }[] };
      const run = data.workflow_runs?.[0];
      if (run) {
        results.push({
          repo: repo.split("/")[1],
          status: run.status,
          conclusion: run.conclusion,
          name: run.name,
          updatedAt: run.updated_at,
        });
      }
    }
  } catch { /* best effort */ }
  return results;
}

async function getCDHealth(): Promise<HealthData["cd"]> {
  // No CD integration for zuga.ee (Netlify auto-deploys from main)
  return [];
}

function getAgentStats(agents: Agent[]): HealthData["agentStats"] {
  const total = agents.length;
  const active = agents.filter((a) => a.agentStatus === "working" || a.agentStatus === "thinking").length;
  const idle = total - active;
  const withCtx = agents.filter((a) => a.contextPct != null);
  const avgContextPct = withCtx.length > 0
    ? Math.round(withCtx.reduce((sum, a) => sum + (a.contextPct ?? 0), 0) / withCtx.length)
    : null;
  return { total, active, idle, avgContextPct };
}

function getSwapInfo(): { swapTotalMb: number; swapUsedMb: number } {
  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf-8");
    const val = (key: string) => {
      const m = meminfo.match(new RegExp(`^${key}:\\s+(\\d+)`, "m"));
      return m ? parseInt(m[1], 10) : 0; // kB
    };
    const total = val("SwapTotal");
    const free = val("SwapFree");
    return { swapTotalMb: Math.round(total / 1024), swapUsedMb: Math.round((total - free) / 1024) };
  } catch {
    return { swapTotalMb: 0, swapUsedMb: 0 };
  }
}

let prevCpuTimes: { idle: number; total: number } | null = null;

function getCpuPct(): number {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const cpu of cpus) {
    const t = cpu.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  if (!prevCpuTimes) {
    prevCpuTimes = { idle, total };
    return 0;
  }
  const dIdle = idle - prevCpuTimes.idle;
  const dTotal = total - prevCpuTimes.total;
  prevCpuTimes = { idle, total };
  return dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
}

function getGpuInfo(): HealthData["system"]["gpu"] {
  try {
    const out = execSync("nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu,utilization.gpu --format=csv,noheader,nounits", { timeout: 3000, encoding: "utf-8" }) as string;
    const [name, vramUsed, vramTotal, temp, gpuUtil] = out.trim().split(", ");
    return {
      name: name.trim(),
      vramUsedMb: parseInt(vramUsed, 10),
      vramTotalMb: parseInt(vramTotal, 10),
      tempC: parseInt(temp, 10),
      gpuPct: parseInt(gpuUtil, 10),
    };
  } catch {
    return null;
  }
}

function getSystemHealth(): HealthData["system"] {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const swap = getSwapInfo();
  return {
    memUsedMb: Math.round((memTotal - memFree) / 1024 / 1024),
    memTotalMb: Math.round(memTotal / 1024 / 1024),
    swapUsedMb: swap.swapUsedMb,
    swapTotalMb: swap.swapTotalMb,
    cpuPct: getCpuPct(),
    uptimeMin: Math.round(os.uptime() / 60),
    gpu: getGpuInfo(),
  };
}

// ── Snapshot ──────────────────────────────────────────────────────────────────

async function buildSnapshot(): Promise<SSESnapshot> {
  const config = readJsonFile<TeamConfig>(CONFIG_PATH);
  const activePanes = await getTmuxPanes();

  const baseAgents = config ? loadAgents(config, activePanes) : [];
  const messages = loadMessages();
  const tasks = loadTasks();

  // Capture context % (async, per-pane) and agent activities (sync, one JSONL read) in parallel
  const [contextPcts, activityMap] = await Promise.all([
    Promise.all(baseAgents.map((a) => captureContextPct(a.paneId))),
    Promise.resolve(loadAllAgentActivities()),
  ]);
  const agents: Agent[] = baseAgents.map((a, i) => {
    const act = activityMap.get(a.name);
    return {
      ...a,
      contextPct: contextPcts[i],
      lastActivity: act?.lastActivity ?? null,
      agentStatus: act?.status ?? "idle",
    };
  });

  // Health data — git, CI & CD are async, agent stats & system are sync
  const [git, ci, cd] = await Promise.all([getGitHealth(), getCIHealth(), getCDHealth()]);
  const health: HealthData = {
    git,
    ci,
    cd,
    agentStats: getAgentStats(agents),
    system: getSystemHealth(),
  };

  // Load common prompt (cached — file rarely changes)
  let commonPrompt: string | null = null;
  try {
    const cpPath = path.join(REPO_DIR, ".claude", "teams", TEAM_NAME, "common-prompt.md");
    commonPrompt = fs.readFileSync(cpPath, "utf-8");
  } catch { /* optional */ }

  const claudeMd = readFileOr(path.join(REPO_DIR, "CLAUDE.md"));
  const memoryMd = readFileOr(path.join(HOME, ".claude", "projects", "-home-michelek-Documents-github-zuga-ee", "memory", "MEMORY.md"));

  const agentScratchpads: Record<string, string | null> = {};
  for (const a of agents) {
    if (a.name === "team-lead") {
      agentScratchpads[a.name] = memoryMd;
    } else {
      agentScratchpads[a.name] = readFileOr(path.join(MEMORY_DIR, `${a.name}.md`));
    }
  }

  return { agents, messages, tasks, github: githubCache, health, commonPrompt, claudeMd, memoryMd, agentScratchpads, docs: dashboardDocs };
}

// ── Input Sanitization ───────────────────────────────────────────────────────

function sanitizeForShell(input: string): string {
  // Strip newlines and backticks; single-quote wrapping already protects $ in shell
  return input
    .replace(/[\r\n]/g, "")
    .replace(/`/g, "")
    .replace(/'/g, "'\\''");
}

// ── SSE Clients ──────────────────────────────────────────────────────────────

const sseClients = new Set<http.ServerResponse>();

function sendSseUpdate(snapshot: SSESnapshot): void {
  const data = `event: update\ndata: ${JSON.stringify(snapshot)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Broadcast loop every 3s
setInterval(async () => {
  if (sseClients.size === 0) return;
  const snapshot = await buildSnapshot();
  sendSseUpdate(snapshot);
}, 2000);

// ── Auto-reload on source file changes ───────────────────────────────────────

function sendReload(): void {
  const data = `event: update\ndata: ${JSON.stringify({ type: "reload" })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Debounce so rapid saves don't trigger multiple reloads
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleReload(): void {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    sendReload();
  }, 300);
}

// Y-1 + Y-2: watchFile (stat-based polling) instead of inode-based fs.watch:
//   Y-1 — watchFile never throws for non-existent files (unlike fs.watch → ENOENT)
//   Y-2 — polling always reads the current path, so atomic editor saves
//          (vim/emacs write-to-temp then rename-over) don't detach the watcher
for (const watchPath of [path.join(__dirname, "server.ts"), INDEX_PATH]) {
  fs.watchFile(watchPath, { interval: 500 }, () => scheduleReload());
}

// ── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";

  // GET / → serve index.html
  if (method === "GET" && url === "/") {
    try {
      const html = fs.readFileSync(INDEX_PATH, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end("index.html not found");
    }
    return;
  }

  // GET /sse → SSE stream
  if (method === "GET" && url === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(": connected\n\n");

    sseClients.add(res);

    // Send initial snapshot immediately
    const snapshot = await buildSnapshot();
    res.write(`event: update\ndata: ${JSON.stringify(snapshot)}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  // POST /send → deliver message to agent via inbox or tmux
  // Body: { text: string, recipient?: string }
  // Delivery: inbox when recipient is given, tmux otherwise (team-lead fallback)
  if (method === "POST" && url === "/send") {
    let body = "";
    let bodySize = 0;
    const BODY_LIMIT = 16 * 1024; // 16 KB
    req.on("data", (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > BODY_LIMIT) {
        req.destroy();
        res.writeHead(413);
        res.end(JSON.stringify({ error: "payload too large" }));
        return;
      }
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { text, recipient } = JSON.parse(body) as {
          text: string;
          recipient?: string;
        };
        if (!text || typeof text !== "string") {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "text required" }));
          return;
        }

        const config = readJsonFile<TeamConfig>(CONFIG_PATH);

        // Resolve recipient member when given
        let member: TeamMember | undefined;
        if (recipient && typeof recipient === "string") {
          member = config?.members.find((m) => m.name === recipient);
          if (!member) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: `Unknown recipient: ${recipient}` }));
            return;
          }
        }

        const delivery = member ? "inbox" : "tmux";

        if (delivery === "inbox") {
          if (!member) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "recipient required for inbox delivery" }));
            return;
          }
          const inboxPath = path.join(INBOXES_DIR, `${member.name}.json`);
          const existing = readJsonFile<object[]>(inboxPath) ?? [];
          existing.push({
            from: "team-lead",
            text,
            summary: text.slice(0, 60),
            timestamp: new Date().toISOString(),
            read: false,
          });
          fs.writeFileSync(inboxPath, JSON.stringify(existing, null, 2), "utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, delivery: "inbox" }));
        } else {
          // tmux delivery
          let targetPane = "%0";
          if (member?.tmuxPaneId) {
            targetPane = member.tmuxPaneId;
          } else if (config) {
            const lead = config.members.find((m) => m.agentType === "team-lead");
            if (lead?.tmuxPaneId) targetPane = lead.tmuxPaneId;
          }
          const safe = sanitizeForShell(text);
          // Send text first, then C-m 500ms later so Claude Code has time to
          // register the input before receiving the submit keystroke
          await execAsync(`tmux send-keys -t '${targetPane}' '${safe}'`);
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
          await execAsync(`tmux send-keys -t '${targetPane}' C-m`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, delivery: "tmux" }));
        }
      } catch (err) {
        console.error("POST /send error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // GET /github/issue?repo=owner/repo&number=42  — on-demand issue detail
  // GET /github/pr?repo=owner/repo&number=42     — on-demand PR detail
  if (method === "GET" && (url.startsWith("/github/issue") || url.startsWith("/github/pr"))) {
    const isPr = url.startsWith("/github/pr");
    const parsedUrl = new URL(url, "http://localhost");
    const repo = parsedUrl.searchParams.get("repo") ?? "";
    const numStr = parsedUrl.searchParams.get("number") ?? "";

    // Only serve repos from the allow-list (prevents SSRF to arbitrary repos)
    if (!GITHUB_REPOS.includes(repo)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "repo not in allow-list" }));
      return;
    }
    const number = parseInt(numStr, 10);
    if (isNaN(number) || number <= 0) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "invalid number" }));
      return;
    }

    try {
      const fields = isPr
        ? "number,title,body,author,headRefName,baseRefName,isDraft,state,assignees,reviews,comments"
        : "number,title,body,author,labels,createdAt,assignees,comments";
      const subcommand = isPr ? "pr" : "issue";
      const { stdout } = await execFileAsync("gh", [
        subcommand, "view", String(number),
        "--repo", repo,
        "--json", fields,
      ]);
      const data: GhIssueView | GhPrView = JSON.parse(stdout);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error(`GET /github/${isPr ? "pr" : "issue"} error:`, err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  // GET /proxy/image?url=... — proxy GitHub attachment images (requires auth)
  if (method === "GET" && url.startsWith("/proxy/image")) {
    const parsedProxyUrl = new URL(url, "http://localhost");
    const imgUrl = parsedProxyUrl.searchParams.get("url") ?? "";
    const allowed = ["github.com/user-attachments/", "user-images.githubusercontent.com/", "camo.githubusercontent.com/"];
    if (!allowed.some((d) => imgUrl.includes(d))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    try {
      const imgRes = await fetch(imgUrl, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, "User-Agent": "agent-dashboard" },
      });
      const ct = imgRes.headers.get("content-type") ?? "image/png";
      res.writeHead(imgRes.ok ? 200 : imgRes.status, { "Content-Type": ct, "Cache-Control": "max-age=3600" });
      const buf = await imgRes.arrayBuffer();
      res.end(Buffer.from(buf));
    } catch (err) {
      console.error("GET /proxy/image error:", err);
      res.writeHead(502);
      res.end("Bad Gateway");
    }
    return;
  }

  // POST /spawn → spawn an agent in a new tmux pane
  // Body: { name: string }
  if (method === "POST" && url === "/spawn") {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body) as { name: string };
        if (!name || typeof name !== "string") {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "name required" }));
          return;
        }

        // Find agent in roster
        const rosterMembers = loadRoster();
        const rosterAgent = rosterMembers.find((m) => m.name === name);
        if (!rosterAgent) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Agent '${name}' not in roster` }));
          return;
        }

        // Check not already spawned
        const config = readJsonFile<TeamConfig>(CONFIG_PATH);
        if (config?.members.some((m) => m.name === name)) {
          res.writeHead(409);
          res.end(JSON.stringify({ error: `Agent '${name}' already spawned` }));
          return;
        }

        // Get lead session ID for parent-session-id
        const leadSessionId = config?.leadSessionId ?? "";

        // Resolve model name for CLI (sonnet → sonnet, claude-sonnet-4-6 → sonnet)
        const modelMap: Record<string, string> = {
          "claude-sonnet-4-6": "sonnet",
          "claude-opus-4-6": "claude-opus-4-6",
          "claude-haiku-4-5-20251001": "haiku",
          "sonnet": "sonnet",
          "opus": "claude-opus-4-6",
          "haiku": "haiku",
        };
        const cliModel = modelMap[rosterAgent.model ?? "claude-sonnet-4-6"] ?? "sonnet";

        // Build the spawn command
        const cwd = REPO_DIR;
        const claudeBin = "claude";
        const spawnCmd = [
          `cd ${cwd}`,
          "&&",
          "env", "CLAUDECODE=1", "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1",
          claudeBin,
          `--agent-id`, `${name}\\@${TEAM_NAME}`,
          `--agent-name`, name,
          `--team-name`, TEAM_NAME,
          `--agent-color`, rosterAgent.color ?? "gray",
          `--parent-session-id`, leadSessionId,
          `--agent-type`, rosterAgent.agentType ?? "general-purpose",
          `--model`, cliModel,
        ].join(" ");

        // Create a new tmux window and capture the pane ID
        const { stdout: paneId } = await execAsync(
          `tmux split-window -h -d -P -F '#{pane_id}' '${sanitizeForShell(spawnCmd)}'`
        );
        const newPaneId = paneId.trim();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, name, paneId: newPaneId }));
      } catch (err) {
        console.error("POST /spawn error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // POST /shutdown → kill agent tmux pane and remove from config
  // Body: { name: string }
  if (method === "POST" && url === "/shutdown") {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body) as { name: string };
        if (!name || typeof name !== "string") {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "name required" }));
          return;
        }

        const config = readJsonFile<TeamConfig>(CONFIG_PATH);
        const member = config?.members.find((m) => m.name === name);
        if (!member) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Agent '${name}' not in config` }));
          return;
        }

        // Kill the tmux pane
        if (member.tmuxPaneId) {
          try {
            await execFileAsync("tmux", ["kill-pane", "-t", member.tmuxPaneId]);
          } catch { /* pane may already be gone */ }
        }

        // Remove from config
        if (config) {
          config.members = config.members.filter((m) => m.name !== name);
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, name }));
      } catch (err) {
        console.error("POST /shutdown error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // GET /docs?id=xxx → single doc (full content)
  // GET /docs       → all docs (no content, lightweight list)
  if (method === "GET" && url.startsWith("/docs")) {
    const parsedDocUrl = new URL(url, "http://localhost");
    const docId = parsedDocUrl.searchParams.get("id") ?? "";
    if (docId) {
      const doc = dashboardDocs.find((d) => d.id === docId);
      if (!doc) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "doc not found" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(doc));
    } else {
      const list = dashboardDocs.map(({ id, title, from, addedAt }) => ({ id, title, from, addedAt }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(list));
    }
    return;
  }

  // PUT /docs?id=xxx → update title and/or content of an existing doc
  // Body: { title?: string, content?: string }
  if (method === "PUT" && url.startsWith("/docs")) {
    const parsedDocUrl = new URL(url, "http://localhost");
    const docId = parsedDocUrl.searchParams.get("id") ?? "";
    if (!docId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "id required" }));
      return;
    }
    const doc = dashboardDocs.find((d) => d.id === docId);
    if (!doc) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "doc not found" }));
      return;
    }
    let body = "";
    let bodySize = 0;
    const BODY_LIMIT = 512 * 1024;
    req.on("data", (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > BODY_LIMIT) {
        req.destroy();
        res.writeHead(413);
        res.end(JSON.stringify({ error: "payload too large" }));
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try {
        const updates = JSON.parse(body) as { title?: string; content?: string };
        if (updates.title && typeof updates.title === "string") doc.title = updates.title.slice(0, 100);
        if (updates.content && typeof updates.content === "string") doc.content = updates.content;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("PUT /docs error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // POST /docs → add a document to the dashboard tab bar
  // Body: { title: string, content: string, from: string }
  if (method === "POST" && url === "/docs") {
    let body = "";
    let bodySize = 0;
    const BODY_LIMIT = 512 * 1024; // 512 KB
    req.on("data", (chunk: Buffer) => {
      bodySize += chunk.length;
      if (bodySize > BODY_LIMIT) {
        req.destroy();
        res.writeHead(413);
        res.end(JSON.stringify({ error: "payload too large" }));
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { title, content, from } = JSON.parse(body) as {
          title: string;
          content: string;
          from: string;
        };
        if (!title || typeof title !== "string" || !content || typeof content !== "string") {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "title and content required" }));
          return;
        }
        const id = crypto.randomUUID();
        dashboardDocs.push({
          id,
          title: title.slice(0, 100),
          content,
          from: (typeof from === "string" ? from : "unknown").slice(0, 50),
          addedAt: new Date().toISOString(),
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, id }));
      } catch (err) {
        console.error("POST /docs error:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // DELETE /docs?id=xxx → remove a document from the dashboard
  if (method === "DELETE" && url.startsWith("/docs")) {
    const parsedDocUrl = new URL(url, "http://localhost");
    const docId = parsedDocUrl.searchParams.get("id") ?? "";
    if (!docId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "id required" }));
      return;
    }
    const idx = dashboardDocs.findIndex((d) => d.id === docId);
    if (idx === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "doc not found" }));
      return;
    }
    dashboardDocs.splice(idx, 1);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Agent Dashboard running at http://localhost:${PORT}`);
  console.log(`Team: ${TEAM_NAME}`);
  console.log(`Repos: ${GITHUB_REPOS.join(", ")}`);
  console.log(`Config: ${CONFIG_PATH}`);
});

export { server };
