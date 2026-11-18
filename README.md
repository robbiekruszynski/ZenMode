# ZenMode

ZenMode is a small demo that shows why a scraping API matters. You paste a URL, ZenMode fetches the page, and Claude writes a short summary of it.

There's a ZenRows toggle next to the URL field. With it off, ZenMode makes a plain HTTP request, the way a basic script would, and sites with bot protection usually answer with a 403. Turn it on and the same request goes through ZenRows, which handles JavaScript rendering, rotating proxies and anti-bot checks like Cloudflare and DataDome. The page comes back as markdown and Claude summarizes it.

A banner after each run tells you what happened:

- Red: the site blocked the request, for example "Blocked (403)".
- Green: "Got through with ZenRows".
- Amber: the site didn't block a plain request at all, or ZenRows is still working through the site's bot protection and you should try again in a minute.

The results show up in two panels: the raw markdown on the left and Claude's summary on the right. ZenMode never renders the scraped site itself, which avoids pulling someone else's scripts and styles into the page.

## Stack

- Next.js 16 (App Router, Turbopack) with React 19 and TypeScript
- Tailwind CSS 4
- [ZenRows Universal Scraper API](https://docs.zenrows.com) with `js_render`, `premium_proxy` and `response_type=markdown`
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) for the summary
- Fonts via `next/font`: Geist for the interface, Syncopate for the logo

There's no database and no extra SDKs. Both APIs are called with `fetch` from a single route handler.

## Running it locally

You need Node.js 20 or newer, a ZenRows API key and an Anthropic API key.

```bash
git clone https://github.com/robbiekruszynski/zenmode.git
cd zenmode
npm install
```

Create a `.env.local` file in the project root:

```
ZENROWS_API_KEY=your_zenrows_key
ANTHROPIC_API_KEY=your_anthropic_key
```

Optionally, add `ANTHROPIC_MODEL` to pick a different Claude model. The default is `claude-sonnet-4-5`.

`.env.local` is covered by `.gitignore`, so your keys stay out of the repo.

Then start the dev server and open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

## Trying it

1. Enter a protected page, for example `www.scrapingcourse.com/antibot-challenge`.
2. Leave ZenRows off and click Distill. You should get "Blocked (403)".
3. Turn ZenRows on and click Distill again. You should get the page as markdown and a summary from Claude.

Runs through ZenRows usually take 5 to 40 seconds. Getting past a strict bot check can take longer, so it's worth doing a warm-up run before showing this to anyone.

## How it works

The browser sends the URL and the toggle state to `POST /api/brief`. That route:

1. Fetches the page directly, or through ZenRows if the toggle is on.
2. Sends the page text to Claude and asks for a two-sentence overview and a few key points.
3. Returns the outcome, the page content and the summary as JSON.

Some details worth knowing:

- The ZenRows call waits up to 3 minutes, which is what ZenRows recommends for JavaScript rendering with premium proxies.
- If ZenRows times out (504, code `CTX0002`) or returns an empty page within the first 90 seconds, the route retries once.
- Only the first 60,000 characters of a page are sent to Claude, to keep the request fast.
- API keys are only read on the server and never reach the browser.

## Project layout

```
app/
  page.tsx            Page layout and title
  brief.tsx           URL field, ZenRows toggle, status banner and result panels
  top-bar.tsx         About modal and light/dark toggle
  api/brief/route.ts  Fetching, ZenRows, Claude and error handling
  globals.css         Colors for both themes and the title gradient
  layout.tsx          Fonts and page metadata
```

## Troubleshooting

- **Style changes don't show up.** The dev server sometimes keeps serving an old stylesheet. Stop it, run `rm -rf .next`, then `npm run dev` again.
- **"invalid x-api-key" from Claude.** Check that `ANTHROPIC_API_KEY` starts with `sk-ant-`.
- **A run times out.** Wait about a minute before retrying. A request that timed out in ZenMode can still be running on the ZenRows side, and the free plan only allows a few at once.
- **Browser extension errors in the terminal**, such as MetaMask. These come from the extension, not from ZenMode. A private window without extensions avoids them.
