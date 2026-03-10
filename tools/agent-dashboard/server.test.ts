/**
 * Agent Dashboard Server Tests
 *
 * Covers: server startup, SSE endpoint, POST /send sanitization,
 * size limit, snapshot structure, file-not-found resilience,
 * inbox delivery, GitHub endpoints, captureContextPct, loadMessages,
 * loadTasks.
 *
 * Adapted from Eesti-Raudtee/dev-toolkit for zuga.ee
 */

import { vi, beforeAll, afterAll, describe, it, expect, beforeEach } from "vitest";
import type { Server } from "node:http";

// ── Module-level mock state ───────────────────────────────────────────────
// Tests mutate these; vi.mock factories close over them so behaviour
// changes without replacing the mock functions (avoids Vitest ESM quirks).

let _configJson: string | null = null;           // CONFIG_PATH content (or null → ENOENT)
let _inboxDir: string[] = [];                     // files in INBOXES_DIR
let _inboxFiles: Record<string, string> = {};     // filename → JSON content
let _taskDir: string[] = [];                      // files in TASKS_DIR
let _taskFiles: Record<string, string> = {};      // filename → JSON content

// ── Mocks (hoisted by Vitest before module imports) ───────────────────────

const execMock = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
  execFile: vi.fn(),
}));

// Make promisify(anything) return execMock so both execAsync and execFileAsync
// resolve via execMock without touching real processes.
vi.mock("node:util", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:util")>();
  return { ...actual, promisify: () => execMock };
});

// node:fs mock — behaviour is driven by the module-level state variables above.
// Using closure state rather than mockImplementation() calls avoids Vitest ESM
// module-cache issues where the server's import of `fs` holds a stale reference.
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    readFileSync: vi.fn().mockImplementation((filePath: string) => {
      if (String(filePath).endsWith("index.html")) {
        return "<html><body>Agent Dashboard</body></html>";
      }
      if (_configJson !== null && String(filePath).includes("config.json")) {
        return _configJson;
      }
      const base = String(filePath).split("/").pop()!;
      if (base in _inboxFiles) return _inboxFiles[base];
      if (base in _taskFiles) return _taskFiles[base];
      const err = Object.assign(new Error(`ENOENT: ${filePath}`), { code: "ENOENT" });
      throw err;
    }),
    readdirSync: vi.fn().mockImplementation((dirPath) => {
      const dir = String(dirPath);
      if (_inboxDir.length && dir.includes("inboxes")) return _inboxDir;
      if (_taskDir.length && (dir.includes("tasks") && !dir.includes("inboxes"))) return _taskDir;
      return [];
    }),
    writeFileSync: vi.fn(),
    watchFile: vi.fn(),
  };
});

// ── Test setup ────────────────────────────────────────────────────────────

const TEST_PORT = 14242;
const BASE = `http://127.0.0.1:${TEST_PORT}`;

let server: Server;

beforeAll(async () => {
  process.env.PORT = String(TEST_PORT);
  const mod = await import("./server.ts");
  server = mod.server;
  if (!server.listening) {
    await new Promise<void>((resolve) => server.once("listening", resolve));
  }
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  execMock.mockClear();
  // Reset state for each test — prevents any cross-test leakage
  _configJson = null;
  _inboxDir = [];
  _inboxFiles = {};
  _taskDir = [];
  _taskFiles = {};
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function readSseSnapshot(signal: AbortSignal): Promise<Record<string, unknown>> {
  const res = await fetch(BASE + "/sse", { signal });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const match = buffer.match(/event: update\ndata: (.+)\n/);
    if (match) return JSON.parse(match[1]) as Record<string, unknown>;
  }
  throw new Error("SSE stream ended without snapshot");
}

// ── GET / ─────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("returns 200 with HTML content-type", async () => {
    const res = await fetch(BASE + "/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
  });

  it("response body contains HTML", async () => {
    const res = await fetch(BASE + "/");
    const text = await res.text();
    expect(text).toContain("<html");
  });
});

// ── GET /sse ─────────────────────────────────────────────────────────────

describe("GET /sse", () => {
  it("returns Content-Type: text/event-stream", async () => {
    const controller = new AbortController();
    const res = await fetch(BASE + "/sse", { signal: controller.signal });
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    controller.abort();
  });

  it("initial event contains snapshot with agents/messages/tasks/github fields", async () => {
    const controller = new AbortController();
    const snapshot = await readSseSnapshot(controller.signal);
    controller.abort();

    expect(snapshot).toHaveProperty("agents");
    expect(snapshot).toHaveProperty("messages");
    expect(snapshot).toHaveProperty("tasks");
    expect(snapshot).toHaveProperty("github");
    expect(Array.isArray(snapshot.agents)).toBe(true);
    expect(Array.isArray(snapshot.messages)).toBe(true);
    expect(Array.isArray(snapshot.tasks)).toBe(true);
    expect(typeof snapshot.github).toBe("object");
  });
});

// ── GET /sse — captureContextPct ──────────────────────────────────────────

describe("GET /sse — captureContextPct", () => {
  const FINN_CONFIG = JSON.stringify({
    name: "test-team",
    members: [{ name: "finn", agentType: "researcher", tmuxPaneId: "%1", backendType: "tmux", color: "blue" }],
  });

  it("parses context % from tmux capture-pane output and surfaces it in agent", async () => {
    _configJson = FINN_CONFIG;

    // execMock dispatch: list-panes → captureContextPct → capturePanePreview
    // (any timer-triggered buildSnapshots also use this logic, safely)
    let captureCallCount = 0;
    execMock.mockImplementation(async (...args: unknown[]) => {
      const firstArg = args[0] as string;
      const cmdArgs = args[1] as string[] | undefined;
      if (typeof firstArg === "string" && firstArg.includes("list-panes")) {
        return { stdout: "%1\n", stderr: "" };
      }
      if (cmdArgs?.includes("capture-pane")) {
        captureCallCount++;
        return captureCallCount % 2 === 1
          ? { stdout: "context ██ 67% used", stderr: "" }
          : { stdout: "output line 1\noutput line 2", stderr: "" };
      }
      return { stdout: "", stderr: "" };
    });

    const controller = new AbortController();
    const snapshot = await readSseSnapshot(controller.signal);
    controller.abort();

    const agents = snapshot.agents as Array<{ name: string; contextPct: number | null; isActive: boolean }>;
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("finn");
    expect(agents[0].isActive).toBe(true); // pane %1 is in the active set
    expect(agents[0].contextPct).toBe(67);
  });

  it("returns contextPct null when pane output has no % pattern", async () => {
    _configJson = FINN_CONFIG;

    execMock.mockImplementation(async (...args: unknown[]) => {
      const firstArg = args[0] as string;
      const cmdArgs = args[1] as string[] | undefined;
      if (typeof firstArg === "string" && firstArg.includes("list-panes")) {
        return { stdout: "%1\n", stderr: "" };
      }
      if (cmdArgs?.includes("capture-pane")) {
        return { stdout: "no percent sign here", stderr: "" };
      }
      return { stdout: "", stderr: "" };
    });

    const controller = new AbortController();
    const snapshot = await readSseSnapshot(controller.signal);
    controller.abort();

    const agents = snapshot.agents as Array<{ contextPct: number | null }>;
    expect(agents[0].contextPct).toBeNull();
  });
});

// ── GET /sse — loadMessages ───────────────────────────────────────────────

describe("GET /sse — loadMessages", () => {
  it("filters idle_notification messages and exposes the to field", async () => {
    _inboxDir = ["finn.json"];
    _inboxFiles["finn.json"] = JSON.stringify([
      { from: "team-lead", text: '{"type":"idle_notification","agentName":"finn"}', timestamp: "2026-03-04T10:00:00Z" },
      { from: "team-lead", text: "Hello Finn!", summary: "hi", timestamp: "2026-03-04T10:01:00Z", color: "green" },
    ]);

    const controller = new AbortController();
    const snapshot = await readSseSnapshot(controller.signal);
    controller.abort();

    const messages = snapshot.messages as Array<{ from: string; to: string; text: string; color: string }>;
    // Only the real message — idle_notification must be filtered out
    expect(messages).toHaveLength(1);
    expect(messages[0].from).toBe("team-lead");
    expect(messages[0].to).toBe("finn");
    expect(messages[0].text).toBe("Hello Finn!");
    expect(messages[0].color).toBe("green");
  });
});

// ── GET /sse — loadTasks ──────────────────────────────────────────────────

describe("GET /sse — loadTasks", () => {
  it("skips deleted tasks and sorts remaining by numeric ID ascending", async () => {
    _taskDir = ["3.json", "1.json", "2.json"];
    _taskFiles["1.json"] = JSON.stringify({ id: "1", subject: "Task one", status: "completed", owner: "finn" });
    _taskFiles["2.json"] = JSON.stringify({ id: "2", subject: "Task two (deleted)", status: "deleted", owner: null });
    _taskFiles["3.json"] = JSON.stringify({ id: "3", subject: "Task three", status: "pending", owner: null });

    const controller = new AbortController();
    const snapshot = await readSseSnapshot(controller.signal);
    controller.abort();

    const tasks = snapshot.tasks as Array<{ id: string; subject: string; status: string }>;
    // deleted task #2 must be absent; remaining sorted by numeric ID
    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toBe("1");
    expect(tasks[1].id).toBe("3");
    expect(tasks.some((t) => t.status === "deleted")).toBe(false);
  });
});

// ── POST /send — sanitization ─────────────────────────────────────────────

describe("POST /send — sanitization", () => {
  it("normal text passes through and returns 200", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world" }),
    });
    expect(res.status).toBe(200);
    const firstCall = execMock.mock.calls[0][0] as string;
    expect(firstCall).toContain("hello world");
  });

  it("strips backticks from input", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "echo `id`" }),
    });
    expect(res.status).toBe(200);
    const firstCall = execMock.mock.calls[0][0] as string;
    expect(firstCall).not.toContain("`");
  });

  it("strips newlines from input", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "line1\nline2\r\nline3" }),
    });
    expect(res.status).toBe(200);
    const firstCall = execMock.mock.calls[0][0] as string;
    expect(firstCall).not.toMatch(/[\r\n]/);
  });

  it("escapes single quotes using POSIX shell quoting", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "it's fine" }),
    });
    expect(res.status).toBe(200);
    const firstCall = execMock.mock.calls[0][0] as string;
    expect(firstCall).toContain("'\\''");
  });

  it("$ and \\ pass through (protected by single-quote shell wrapping)", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "echo $HOME and C:\\path" }),
    });
    expect(res.status).toBe(200);
    const firstCall = execMock.mock.calls[0][0] as string;
    expect(firstCall).toContain("$HOME");
    expect(firstCall).toContain("C:\\path");
  });

  it("returns 400 when body has no text field", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notText: "oops" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/text required/i);
  });

  it("returns 400 when text is empty string", async () => {
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /send — size limit ───────────────────────────────────────────────

describe("POST /send — size limit", () => {
  it("body just under 16 KB returns 200", async () => {
    const safeText = "x".repeat(16 * 1024 - 100);
    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: safeText }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 413 when body exceeds 16 KB", async () => {
    const bigBody = JSON.stringify({ text: "x".repeat(17 * 1024) });
    let status: number | null = null;
    try {
      const res = await fetch(BASE + "/send", { method: "POST", body: bigBody });
      status = res.status;
    } catch {
      status = 413;
    }
    expect(status).toBe(413);
  });
});

// ── POST /send — inbox delivery ───────────────────────────────────────────

describe("POST /send — inbox delivery", () => {
  const MEMBER_CONFIG = JSON.stringify({
    name: "test-team",
    members: [{ name: "finn", agentType: "researcher", tmuxPaneId: "%1", backendType: "tmux", color: "blue" }],
  });

  it("returns 404 when recipient is unknown", async () => {
    _configJson = MEMBER_CONFIG;

    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello", recipient: "nobody" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/unknown recipient/i);
  });

  it("known recipient delivers via inbox and returns {ok:true, delivery:'inbox'}", async () => {
    _configJson = MEMBER_CONFIG;
    _inboxFiles["finn.json"] = JSON.stringify([]);    // existing empty inbox

    const fsMod = await import("node:fs");
    vi.mocked(fsMod.writeFileSync).mockClear();

    const res = await fetch(BASE + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hi finn", recipient: "finn" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; delivery: string };
    expect(body.ok).toBe(true);
    expect(body.delivery).toBe("inbox");

    expect(vi.mocked(fsMod.writeFileSync)).toHaveBeenCalledOnce();
    const writtenContent = JSON.parse(
      vi.mocked(fsMod.writeFileSync).mock.calls[0][1] as string
    ) as Array<{ from: string; text: string }>;
    expect(writtenContent[0].from).toBe("team-lead");
    expect(writtenContent[0].text).toBe("hi finn");
  });
});

// ── GET /github/issue ─────────────────────────────────────────────────────

describe("GET /github/issue", () => {
  it("returns 403 when repo is not in allow-list", async () => {
    const res = await fetch(BASE + "/github/issue?repo=evil/repo&number=1");
    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/allow-list/);
  });

  it("returns 400 when number is not a valid integer", async () => {
    const res = await fetch(BASE + "/github/issue?repo=mitselek/zuga.ee&number=abc");
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid number/i);
  });

  it("returns 200 with issue JSON when gh CLI succeeds", async () => {
    const mockIssue = { number: 42, title: "Test issue", body: "Details", author: { login: "finn" }, labels: [], createdAt: "2026-03-01T00:00:00Z", assignees: [], comments: [] };
    execMock.mockResolvedValueOnce({ stdout: JSON.stringify(mockIssue), stderr: "" });

    const res = await fetch(BASE + "/github/issue?repo=mitselek/zuga.ee&number=42");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const data = await res.json() as typeof mockIssue;
    expect(data.number).toBe(42);
    expect(data.title).toBe("Test issue");
  });

  it("returns 500 when gh CLI fails", async () => {
    execMock.mockRejectedValueOnce(new Error("gh: could not resolve repo"));
    const res = await fetch(BASE + "/github/issue?repo=mitselek/zuga.ee&number=1");
    expect(res.status).toBe(500);
  });
});

// ── GET /github/pr ────────────────────────────────────────────────────────

describe("GET /github/pr", () => {
  it("returns 200 with PR JSON when gh CLI succeeds", async () => {
    const mockPr = { number: 15, title: "Test PR", body: "Adds tests", author: { login: "tess" }, headRefName: "story/14", baseRefName: "master", isDraft: false, state: "OPEN", assignees: [], reviews: [], comments: [] };
    execMock.mockResolvedValueOnce({ stdout: JSON.stringify(mockPr), stderr: "" });

    const res = await fetch(BASE + "/github/pr?repo=mitselek/zuga.ee&number=15");
    expect(res.status).toBe(200);
    const data = await res.json() as typeof mockPr;
    expect(data.number).toBe(15);
    expect(data.headRefName).toBe("story/14");
  });
});

// ── File-not-found resilience ─────────────────────────────────────────────

describe("file-not-found resilience", () => {
  it("snapshot returns empty arrays when inbox/task dirs are missing", async () => {
    const fsMod = await import("node:fs");
    vi.mocked(fsMod.readdirSync).mockImplementation(() => {
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    });

    const controller = new AbortController();
    const res = await fetch(BASE + "/sse", { signal: controller.signal });
    expect(res.status).toBe(200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let snapshot: { agents: unknown[]; messages: unknown[]; tasks: unknown[] } | null = null;

    while (!snapshot) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const match = buffer.match(/event: update\ndata: (.+)\n/);
      if (match) snapshot = JSON.parse(match[1]) as typeof snapshot;
    }
    controller.abort();

    expect(snapshot!.messages).toEqual([]);
    expect(snapshot!.tasks).toEqual([]);

    // Restore the closure-based implementation
    vi.mocked(fsMod.readdirSync).mockImplementation((dirPath) => {
      const dir = String(dirPath);
      if (_inboxDir.length && dir.includes("inboxes")) return _inboxDir as unknown as ReturnType<typeof fsMod.readdirSync>;
      if (_taskDir.length && dir.includes("tasks") && !dir.includes("inboxes")) return _taskDir as unknown as ReturnType<typeof fsMod.readdirSync>;
      return [] as unknown as ReturnType<typeof fsMod.readdirSync>;
    });
  });

  it("GET / returns 500 gracefully when index.html is missing", async () => {
    const fsMod = await import("node:fs");
    vi.mocked(fsMod.readFileSync).mockImplementationOnce(() => {
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    });
    const res = await fetch(BASE + "/");
    expect(res.status).toBe(500);
  });
});

// ── 404 ──────────────────────────────────────────────────────────────────

describe("unknown routes", () => {
  it("returns 404 for unrecognized paths", async () => {
    const res = await fetch(BASE + "/unknown-route");
    expect(res.status).toBe(404);
  });
});
