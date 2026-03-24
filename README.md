# screenshotrun-mcp

[![npm version](https://img.shields.io/npm/v/screenshotrun-mcp.svg)](https://www.npmjs.com/package/screenshotrun-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Give your AI agent the ability to see any webpage. MCP server for [ScreenshotRun](https://screenshotrun.com) Screenshot API.

## Quick Start

### Get your API key

Sign up for a free API key at [screenshotrun.com](https://screenshotrun.com).

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

### Claude Code

```bash
claude mcp add screenshotrun \
  npx -y screenshotrun-mcp \
  -e SCREENSHOTRUN_API_KEY=sr_live_your_key_here
```

### Cursor / Windsurf

Add to your MCP configuration with the same `npx -y screenshotrun-mcp` command and set the `SCREENSHOTRUN_API_KEY` environment variable.

## Available Tools

| Tool | Description |
|------|-------------|
| `take_screenshot` | Capture a screenshot of any webpage. Supports custom viewport, device emulation, dark mode, full-page, ad blocking, and more. Returns the image as base64. |
| `check_usage` | Check your ScreenshotRun API usage — screenshots used, remaining, and billing period. |

### `take_screenshot` Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | *required* | URL to screenshot (http/https) |
| `format` | `png` \| `jpeg` \| `webp` \| `pdf` | `png` | Output format |
| `width` | number | 1280 | Viewport width (320–3840) |
| `height` | number | 800 | Viewport height (200–2160) |
| `full_page` | boolean | false | Capture entire scrollable page |
| `quality` | number | 80 | JPEG/WebP quality (1–100) |
| `device` | `desktop` \| `mobile` \| `tablet` | — | Device preset |
| `dark_mode` | boolean | false | Dark mode |
| `block_ads` | boolean | false | Block advertisements |
| `block_cookies` | boolean | true | Block cookie banners |
| `delay` | number | 0 | Delay in seconds (0–10) |
| `retina` | boolean | false | 2x resolution |
| `css` | string | — | Custom CSS to inject |
| `js` | string | — | Custom JS to execute |
| `selector` | string | — | Capture specific element |
| `hide_selectors` | string[] | — | Hide elements by selector |
| `click_selector` | string | — | Click element before capture |
| `scroll_to` | string | — | Scroll to element |

## Example Prompts

- "Take a screenshot of https://github.com"
- "Screenshot example.com in dark mode on mobile"
- "Capture full-page screenshot of my website and describe what you see"
- "Take a retina screenshot of https://news.ycombinator.com in JPEG format"
- "Check my ScreenshotRun API usage"

## License

MIT
