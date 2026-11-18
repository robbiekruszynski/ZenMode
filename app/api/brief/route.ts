export type BriefResult = {
  outcome: "blocked" | "zenrows" | "direct" | "slow" | "error";
  message: string;
  httpStatus?: number;
  content?: string;
  summary?: string;
  summaryError?: string;
};

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Keeps the Claude request well inside the context window and fast for a live demo.
const MAX_SUMMARY_INPUT_CHARS = 60_000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
    useZenRows?: unknown;
  } | null;

  const target = normalizeUrl(body?.url);
  if (!target) {
    return Response.json(
      { outcome: "error", message: "Enter a valid http(s) URL." } satisfies BriefResult,
      { status: 400 },
    );
  }

  const fetched = body?.useZenRows
    ? await fetchWithZenRows(target)
    : await fetchDirect(target);

  if (!fetched.content) {
    return Response.json(fetched);
  }

  const { summary, summaryError } = await summarize(target, fetched.content);
  return Response.json({ ...fetched, summary, summaryError } satisfies BriefResult);
}

function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const withScheme = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function fetchDirect(target: string): Promise<BriefResult> {
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": BROWSER_USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return {
        outcome: "blocked",
        httpStatus: res.status,
        message: `Blocked (${res.status})`,
      };
    }
    const content = htmlToText(await res.text());
    if (!content) {
      return {
        outcome: "blocked",
        httpStatus: res.status,
        message: "Blocked (empty page)",
      };
    }
    return {
      outcome: "direct",
      httpStatus: res.status,
      message: "Got through without ZenRows. This site isn't blocking scrapers",
      content,
    };
  } catch (err) {
    return {
      outcome: "error",
      message: `Couldn't reach the site (${errorReason(err)})`,
    };
  }
}

async function fetchWithZenRows(target: string): Promise<BriefResult> {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    return { outcome: "error", message: "Add ZENROWS_API_KEY to .env.local" };
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    url: target,
    js_render: "true",
    premium_proxy: "true",
    response_type: "markdown",
  });

  // ZenRows recommends a client timeout of at least 3 minutes for js_render + premium_proxy.
  const deadline = AbortSignal.timeout(180_000);
  const startedAt = Date.now();
  const slow: BriefResult = {
    outcome: "slow",
    message: "ZenRows is still working through this site’s bot protection. Try again in a minute.",
  };

  try {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`https://api.zenrows.com/v1/?${params}`, { signal: deadline });
      const text = await res.text();
      if (res.ok && text.trim()) {
        return {
          outcome: "zenrows",
          httpStatus: res.status,
          message: "Got through with ZenRows",
          content: text.trim(),
        };
      }

      // 504 / CTX0002 means ZenRows hit its own time limit, and a 200 with an empty body means
      // the page hadn't rendered yet; a fresh attempt often succeeds in both cases.
      const emptyPage = res.ok;
      const zenRowsTimedOut = res.status === 504 || text.includes("CTX0002");
      const retryable = emptyPage || zenRowsTimedOut;
      if (retryable && attempt === 1 && Date.now() - startedAt < 90_000) continue;
      if (emptyPage) {
        return {
          outcome: "slow",
          httpStatus: res.status,
          message: "ZenRows got through, but the page came back empty. Try again.",
        };
      }
      if (zenRowsTimedOut) return { ...slow, httpStatus: res.status };

      return {
        outcome: "error",
        httpStatus: res.status,
        message: `ZenRows couldn't fetch it (${res.status})${zenRowsErrorDetail(text)}`,
      };
    }
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") return slow;
    return { outcome: "error", message: `ZenRows request failed (${errorReason(err)})` };
  }
}

async function summarize(
  target: string,
  content: string,
): Promise<{ summary?: string; summaryError?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { summaryError: "Add ANTHROPIC_API_KEY to .env.local to get Claude's summary." };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `Here is the content of ${target}:\n\n<page>\n${content.slice(0, MAX_SUMMARY_INPUT_CHARS)}\n</page>\n\nWrite a short brief of this page: a two-sentence overview, then 3-5 bullet points with the key takeaways. Plain text only: no headings, no bold, no markdown except "-" for bullets. Do not use em dashes.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = await res.json();
    if (!res.ok) {
      return { summaryError: `Claude request failed (${res.status}): ${data?.error?.message ?? "unknown error"}` };
    }
    const summary = (data.content as { type: string; text?: string }[])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\s*—\s*/g, ", ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { summary };
  } catch (err) {
    return { summaryError: `Claude request failed (${errorReason(err)})` };
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function zenRowsErrorDetail(body: string): string {
  try {
    const parsed = JSON.parse(body) as { title?: string; detail?: string };
    const detail = parsed.title ?? parsed.detail;
    return detail ? `: ${detail}` : "";
  } catch {
    return "";
  }
}

function errorReason(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError") return "timed out";
    const code = (err as Error & { cause?: { code?: string } }).cause?.code;
    if (code === "UND_ERR_CONNECT_TIMEOUT") return "connection timed out";
    if (code === "ENOTFOUND") return "domain not found";
    if (code === "ECONNREFUSED") return "connection refused";
    if (code === "ECONNRESET") return "connection reset";
    return code ?? err.message;
  }
  return "network error";
}
