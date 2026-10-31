# screenshotrun-mcp

[![npm version](https://img.shields.io/npm/v/screenshotrun-mcp.svg)](https://www.npmjs.com/package/screenshotrun-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Give your AI agent the ability to see any webpage. MCP server for [ScreenshotRun](https://screenshotrun.com) Screenshot API.

## Features

- Capture screenshots of any public webpage as PNG, JPEG, WebP, or PDF
- Render raw HTML or Markdown to image
- Device emulation — desktop, mobile, and tablet viewports
- Dark mode rendering with `prefers-color-scheme: dark`
- Full-page capture with automatic scrolling
- Block ads, cookie consent banners, and live chat widgets
- Inject custom CSS/JavaScript before capture
- Target specific elements with CSS selectors
- Wait for elements, click, hover, and scroll before capture
- Retina (2x) and custom device pixel ratio support
- Geolocation and timezone emulation
- Stealth mode to avoid bot detection
- Transparent background, clipping, and output resizing
- Extract page metadata (title, description, OG tags, Twitter Card)
- Analyze page structure — headings, interactive elements, forms, images, navigation with bounding rectangles
- Certified screenshots with SHA-256 hash
- PDF output with custom page format and margins
- Scroll video recording
- Monitor your API usage and remaining quota

## Quick Start

### 1. Get your API key

Sign up for a free API key at [screenshotrun.com](https://screenshotrun.com).

### 2. Configure your AI client

#### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "screenshotrun": {
      "command": "npx",
      "args": ["-y", "screenshotrun-mcp"],
      "env": {
        "SCREENSHOTRUN_API_KEY": "sr_live_your_key_here"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add screenshotrun \
  npx -y screenshotrun-mcp \
  -e SCREENSHOTRUN_API_KEY=sr_live_your_key_here
```

#### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "screenshotrun": {
      "command": "npx",
      "args": ["-y", "screenshotrun-mcp"],
      "env": {
        "SCREENSHOTRUN_API_KEY": "sr_live_your_key_here"
      }
    }
  }
}
```

#### Windsurf / VS Code

Add to your MCP configuration with the same `npx -y screenshotrun-mcp` command and set the `SCREENSHOTRUN_API_KEY` environment variable.

## Available Tools

### `take_screenshot`

Capture a screenshot of any webpage, raw HTML, or Markdown. Returns the image as base64-encoded data that AI agents can analyze and describe.

#### Source (one required)

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL to screenshot (http:// or https://) |
| `html` | string | Raw HTML to render (max 500KB) |
| `markdown` | string | Markdown to render (max 500KB) |

#### Output

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | `png` \| `jpeg` \| `webp` \| `pdf` | `png` | Output format |
| `quality` | number | 80 | Image quality for JPEG/WebP (1-100) |

#### Viewport & Device

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | 1280 | Viewport width (320-3840) |
| `height` | number | 800 | Viewport height (200-2160) |
| `full_page` | boolean | false | Capture entire scrollable page |
| `device` | `desktop` \| `mobile` \| `tablet` | -- | Device preset |
| `retina` | boolean | false | 2x resolution |
| `device_scale_factor` | number | -- | Custom pixel ratio (0.5-4) |

#### Appearance

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dark_mode` | boolean | false | Enable dark mode |
| `omit_background` | boolean | false | Transparent background (PNG/WebP) |
| `media_type` | `screen` \| `print` | -- | Emulate CSS media type |
| `reduced_motion` | boolean | false | Emulate prefers-reduced-motion |
| `disable_animations` | boolean | false | Disable CSS animations |

#### Blocking

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `block_ads` | boolean | false | Block advertisements |
| `block_cookies` | boolean | true | Block cookie consent dialogs |
| `block_chats` | boolean | false | Block live chat widgets |
| `block_requests` | string[] | -- | URL patterns to block |
| `block_resources` | string[] | -- | Resource types to block (image, stylesheet, font, script, media, websocket, manifest, other) |

#### Interaction

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | string | CSS selector to capture a specific element |
| `click_selector` | string | Element to click before capture |
| `hover_selector` | string | Element to hover before capture |
| `scroll_to` | string | Element to scroll into view |
| `hide_selectors` | string[] | Elements to hide before capture |
| `wait_for_selector` | string | Wait for element to appear |

#### Injection

| Parameter | Type | Description |
|-----------|------|-------------|
| `css` | string | Custom CSS (max 10KB) |
| `js` | string | Custom JavaScript (max 10KB) |
| `user_agent` | string | Custom User-Agent |
| `headers` | object | Custom HTTP headers |
| `cookies` | array | Cookies to set (`{name, value, domain?}`) |

#### Timing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delay` | number | 0 | Seconds to wait after load (0-10) |
| `timeout` | number | 30 | Max page load time (5-60s) |
| `navigation_timeout` | number | -- | Max navigation time (5-60s) |
| `wait_until` | string | -- | `load`, `domcontentloaded`, `networkidle`, or `commit` |

#### Clipping & Resizing

| Parameter | Type | Description |
|-----------|------|-------------|
| `resize_width` | number | Resize output width (16-3840) |
| `resize_height` | number | Resize output height (16-2160) |
| `clip` | object | Clip rectangle `{x, y, width, height}` |

#### Advanced

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stealth` | boolean | false | Stealth mode (avoid bot detection) |
| `bypass_csp` | boolean | false | Bypass Content Security Policy |
| `cache_ttl` | number | -- | Cache duration in seconds (0-86400) |
| `extract_metadata` | boolean | false | Extract page metadata (title, OG, Twitter Card) |
| `certified` | boolean | false | Certified screenshot with SHA-256 |

#### Geolocation

| Parameter | Type | Description |
|-----------|------|-------------|
| `geolocation` | object | `{latitude, longitude, accuracy?}` |
| `timezone` | string | e.g. `America/New_York` |
| `proxy` | string | HTTP/SOCKS proxy URL |

#### PDF Options (format=pdf)

| Parameter | Type | Description |
|-----------|------|-------------|
| `pdf_landscape` | boolean | Landscape orientation |
| `pdf_page_format` | string | `A3`, `A4`, `A5`, `Letter`, `Legal`, `Tabloid` |
| `pdf_margin_top` | string | e.g. `1cm`, `0.5in` |
| `pdf_margin_right` | string | Right margin |
| `pdf_margin_bottom` | string | Bottom margin |
| `pdf_margin_left` | string | Left margin |

#### Scroll Video

| Parameter | Type | Description |
|-----------|------|-------------|
| `scroll_video` | boolean | Record scrolling video |
| `scroll_duration` | number | Duration 2-30 seconds |
| `scroll_speed` | `slow` \| `medium` \| `fast` | Scroll speed |

### `analyze_page`

Analyze any webpage and get structured data about its content. Returns headings, interactive elements (buttons, links, inputs), forms, images, and navigation links — each with a bounding rectangle `[x, y, width, height]` for visual mapping. Pro feature with 20 free trial runs per month.

#### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | URL to analyze (http:// or https://) |
| `include` | string[] | all | Categories to return: `headings`, `interactive`, `forms`, `images`, `text`, `navigation` |
| `visible_only` | boolean | true | Only return visible elements |
| `scope` | string | -- | CSS selector to limit analysis to a section (e.g. `main`, `#content`) |
| `with_screenshot` | boolean | false | Capture screenshot alongside analysis (costs 1 extra request) |

#### Viewport & Appearance

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | 1280 | Viewport width (320-3840) |
| `height` | number | 800 | Viewport height (200-2160) |
| `device` | `desktop` \| `mobile` \| `tablet` | -- | Device preset |
| `dark_mode` | boolean | false | Enable dark mode |

#### Blocking & Timing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `block_ads` | boolean | false | Block advertisements |
| `block_cookies` | boolean | true | Block cookie consent dialogs |
| `block_chats` | boolean | false | Block live chat widgets |
| `delay` | number | 0 | Seconds to wait after load (0-10) |
| `timeout` | number | 30 | Max page load time (5-60s) |
| `stealth` | boolean | false | Stealth mode |

#### Injection & Advanced

| Parameter | Type | Description |
|-----------|------|-------------|
| `css` | string | Custom CSS (max 10KB) |
| `js` | string | Custom JavaScript (max 10KB) |
| `hide_selectors` | string[] | Elements to hide before analysis |
| `wait_for_selector` | string | Wait for element to appear |
| `user_agent` | string | Custom User-Agent |
| `proxy` | string | HTTP/SOCKS proxy URL |
| `timezone` | string | e.g. `America/New_York` |
| `geolocation` | object | `{latitude, longitude, accuracy?}` |
| `headers` | object | Custom HTTP headers |
| `cookies` | array | Cookies to set (`{name, value, domain?}`) |

### `extract_content`

Extract page metadata from any URL without downloading the full image. Returns title, description, Open Graph tags, Twitter Card tags, favicon URL, and HTTP status. Useful for SEO audits, content analysis, and link previews.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL to extract metadata from |

### `check_usage`

Check your ScreenshotRun API usage for the current billing period. Returns screenshots used, remaining quota, usage percentage, and days remaining.

No parameters required.

## Example Prompts

- "Take a screenshot of screenshotrun.com"
- "Screenshot stripe.com on mobile in dark mode"
- "Capture full-page screenshot of my website in WebP"
- "Take a retina screenshot of example.com in JPEG format"
- "Screenshot a page with the cookie banner and chat widget hidden"
- "Render this HTML as an image: `<h1>Hello World</h1>`"
- "Capture example.com as seen from Tokyo" (with geolocation + timezone)
- "Take a screenshot with transparent background for my design comp"
- "Wait for the `.loading-spinner` to disappear, then screenshot"
- "Click the 'Show More' button, then capture the page"
- "Analyze the page structure of competitor.com — show me all headings and interactive elements"
- "What forms and images are on this landing page?"
- "Analyze example.com on mobile and show me the navigation links"
- "Extract the OG tags and meta description from competitor.com"
- "Check how many screenshots I have left this month"

## How It Works

1. Your AI agent receives a user request involving a webpage
2. The agent calls the appropriate tool (`take_screenshot`, `analyze_page`, or `extract_content`)
3. The MCP server sends the request to the ScreenshotRun API
4. The API renders the page in a real browser and returns the result
5. Screenshots are returned as base64 images; analysis results are returned as structured text with element positions

## Requirements

- Node.js 18+
- A ScreenshotRun API key ([get one free](https://screenshotrun.com))

## Other Projects by ScreenshotRun

- [SnapshotArchive](https://snapshotarchive.com) — Automated website monitoring with visual diff detection
- [WatchCron](https://watchcron.com) — Cron job & heartbeat monitoring for developers

## License

MIT
