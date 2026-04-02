const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

interface ErrorReport {
  message: string;
  detail?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  consoleLogs: string[];
}

export async function sendErrorReport(report: ErrorReport): Promise<boolean> {
  if (!WEBHOOK_URL) return false;

  const logsText = report.consoleLogs.length > 0
    ? report.consoleLogs.join("\n").slice(0, 1500)
    : "없음";

  const fields = [
    { name: "Message", value: report.message.slice(0, 1024) },
    ...(report.detail
      ? [{ name: "API Detail", value: `\`\`\`\n${report.detail.slice(0, 1024)}\n\`\`\`` }]
      : []),
    { name: "Page", value: report.url },
    { name: "Timestamp", value: report.timestamp },
    { name: "User Agent", value: report.userAgent.slice(0, 256) },
    { name: "Console Logs", value: `\`\`\`\n${logsText}\n\`\`\`` },
  ];

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ title: "Error Report", color: 0xff0000, fields }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const LOG_BUFFER_SIZE = 20;
const logBuffer: string[] = [];

export function getRecentLogs(): string[] {
  return [...logBuffer];
}

export function captureConsoleLogs() {
  if (typeof window === "undefined") return;

  const originalError = console.error;
  const originalWarn = console.warn;

  function pushLog(level: string, args: unknown[]) {
    const line = `[${level}] ${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`;
    logBuffer.push(line);
    if (logBuffer.length > LOG_BUFFER_SIZE) {
      logBuffer.shift();
    }
  }

  console.error = (...args: unknown[]) => {
    pushLog("ERROR", args);
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    pushLog("WARN", args);
    originalWarn.apply(console, args);
  };
}
