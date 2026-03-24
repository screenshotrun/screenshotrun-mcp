# screenshotrun-mcp

[![npm version](https://img.shields.io/npm/v/screenshotrun-mcp.svg)](https://www.npmjs.com/package/screenshotrun-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Give your AI agent the ability to see any webpage. MCP server for [ScreenshotRun](https://screenshotrun.com) Screenshot API.

## Features

- Capture screenshots of any public webpage as PNG, JPEG, WebP, or PDF
- Device emulation — desktop, mobile, and tablet viewports
- Dark mode rendering with `prefers-color-scheme: dark`
- Full-page capture with automatic scrolling
- Block ads and cookie consent banners
- Inject custom CSS/JavaScript before capture
- Target specific elements with CSS selectors
- Retina (2x) resolution support
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

#### Windsurf

Add to your Windsurf MCP configuration with the same `npx -y screenshotrun-mcp` command and set the `SCREENSHOTRUN_API_KEY` environment variable.

## Available Tools

### `take_screenshot`

Capture a screenshot of any webpage. Returns the image as base64-encoded data that AI agents can analyze and describe.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | *required* | URL to screenshot (must include http:// or https://) |
| `format` | `png` \| `jpeg` \| `webp` \| `pdf` | `png` | Output image format |
| `width` | number | 1280 | Viewport width in pixels (320–3840) |
| `height` | number | 800 | Viewport height in pixels (200–2160) |
| `full_page` | boolean | false | Capture the entire scrollable page |
| `quality` | number | 80 | Image quality for JPEG/WebP (1–100) |
| `device` | `desktop` \| `mobile` \| `tablet` | — | Device preset (overrides width/height with device defaults) |
| `dark_mode` | boolean | false | Enable dark mode rendering |
| `block_ads` | boolean | false | Block advertisements during capture |
| `block_cookies` | boolean | true | Block cookie consent dialogs |
| `delay` | number | 0 | Delay in seconds after page load before capturing (0–10) |
| `retina` | boolean | false | Capture at 2x resolution |
| `css` | string | — | Custom CSS to inject into the page (max 10KB) |
| `js` | string | — | Custom JavaScript to execute before capture (max 10KB) |
| `selector` | string | — | CSS selector to capture a specific element |
| `hide_selectors` | string[] | — | CSS selectors of elements to hide before capture |
| `click_selector` | string | — | CSS selector of element to click before capture |
| `scroll_to` | string | — | CSS selector of element to scroll into view |

### `check_usage`

Check your ScreenshotRun API usage for the current billing period. Returns screenshots used, remaining quota, usage percentage, and days remaining.

No parameters required.

## Example Prompts

- "Take a screenshot of screenshotrun.com"
- "Screenshot snapshotarchive.com in dark mode on mobile"
- "Capture full-page screenshot of my website and describe what you see"
- "Take a retina screenshot of screenshotrun.com in JPEG format"
- "Screenshot snapshotarchive.com on tablet with ad blocking"
- "Take a screenshot of my site with the cookie banner hidden using hide_selectors"
- "Check my ScreenshotRun API usage"

## How It Works

1. Your AI agent receives a user request involving a webpage screenshot
2. The agent calls the `take_screenshot` tool with the URL and options
3. The MCP server sends the request to the ScreenshotRun API
4. The API renders the page in a real browser and returns the screenshot
5. The image is returned to the AI agent as base64, which it can analyze and describe

## Requirements

- Node.js 18+
- A ScreenshotRun API key ([get one free](https://screenshotrun.com))

## Other Projects by ScreenshotRun

- [SnapshotArchive](https://snapshotarchive.com) — Automated website monitoring with visual diff detection
- [WatchCron](https://watchcron.com) — Cron job & heartbeat monitoring for developers

## License

MIT
