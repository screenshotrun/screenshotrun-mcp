import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { takeScreenshot, checkUsage } from "./api.js";

export function registerTools(server: McpServer): void {
  // --- take_screenshot ---
  server.tool(
    "take_screenshot",
    "Capture a screenshot of any webpage, raw HTML, or Markdown. Returns the image as base64-encoded data. Supports custom viewport sizes, device emulation, dark mode, full-page capture, element targeting, CSS/JS injection, geolocation, stealth mode, PDF output, and more.",
    {
      // Source — one of url, html, or markdown is required
      url: z
        .string()
        .url()
        .optional()
        .describe("URL of the page to screenshot (must start with http:// or https://)"),
      html: z
        .string()
        .max(500000)
        .optional()
        .describe("Raw HTML to render and screenshot (alternative to url)"),
      markdown: z
        .string()
        .max(500000)
        .optional()
        .describe("Markdown content to render and screenshot (alternative to url)"),

      // Output format
      format: z
        .enum(["png", "jpeg", "webp", "pdf"])
        .default("png")
        .describe("Output image format"),
      quality: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(80)
        .describe("Image quality for JPEG/WebP (1-100)"),

      // Viewport
      width: z
        .number()
        .int()
        .min(320)
        .max(3840)
        .default(1280)
        .describe("Viewport width in pixels"),
      height: z
        .number()
        .int()
        .min(200)
        .max(2160)
        .default(800)
        .describe("Viewport height in pixels"),
      full_page: z
        .boolean()
        .default(false)
        .describe("Capture the entire scrollable page"),
      device: z
        .enum(["desktop", "mobile", "tablet"])
        .optional()
        .describe("Device preset (affects viewport and user agent)"),
      retina: z
        .boolean()
        .default(false)
        .describe("Capture at 2x resolution (retina display)"),
      device_scale_factor: z
        .number()
        .min(0.5)
        .max(4)
        .optional()
        .describe("Custom device pixel ratio (0.5-4). Overrides retina setting"),

      // Appearance
      dark_mode: z
        .boolean()
        .default(false)
        .describe("Enable dark mode (prefers-color-scheme: dark)"),
      omit_background: z
        .boolean()
        .default(false)
        .describe("Make the page background transparent (PNG/WebP only)"),
      media_type: z
        .enum(["screen", "print"])
        .optional()
        .describe("Emulate CSS media type"),
      reduced_motion: z
        .boolean()
        .default(false)
        .describe("Emulate prefers-reduced-motion: reduce"),
      disable_animations: z
        .boolean()
        .default(false)
        .describe("Disable all CSS animations and transitions"),

      // Blocking
      block_ads: z
        .boolean()
        .default(false)
        .describe("Block advertisements during capture"),
      block_cookies: z
        .boolean()
        .default(true)
        .describe("Block cookie consent dialogs"),
      block_chats: z
        .boolean()
        .default(false)
        .describe("Block live chat widgets (Intercom, Drift, etc.)"),
      block_requests: z
        .array(z.string().max(500))
        .max(20)
        .optional()
        .describe("URL patterns to block (e.g. ['analytics.js', 'tracker.com'])"),
      block_resources: z
        .array(z.enum(["image", "stylesheet", "font", "script", "media", "websocket", "manifest", "other"]))
        .max(10)
        .optional()
        .describe("Resource types to block"),

      // Interaction
      selector: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector to capture a specific element instead of the full viewport"),
      click_selector: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector of an element to click before capture"),
      hover_selector: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector of an element to hover before capture"),
      scroll_to: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector of an element to scroll into view before capture"),
      hide_selectors: z
        .array(z.string().max(500))
        .max(20)
        .optional()
        .describe("CSS selectors of elements to hide before capture"),
      wait_for_selector: z
        .string()
        .max(500)
        .optional()
        .describe("Wait for this CSS selector to appear before capturing"),

      // Injection
      css: z
        .string()
        .max(10240)
        .optional()
        .describe("Custom CSS to inject into the page"),
      js: z
        .string()
        .max(10240)
        .optional()
        .describe("Custom JavaScript to execute before capture"),
      user_agent: z
        .string()
        .max(500)
        .optional()
        .describe("Custom User-Agent string"),
      headers: z
        .record(z.string().max(2048))
        .optional()
        .describe("Custom HTTP headers as key-value pairs"),
      cookies: z
        .array(z.object({
          name: z.string().max(255),
          value: z.string().max(4096),
          domain: z.string().max(255).optional(),
        }))
        .max(20)
        .optional()
        .describe("Cookies to set before page load"),

      // Timing
      delay: z
        .number()
        .int()
        .min(0)
        .max(10)
        .default(0)
        .describe("Delay in seconds after page load before capturing"),
      timeout: z
        .number()
        .int()
        .min(5)
        .max(60)
        .optional()
        .describe("Maximum time in seconds to wait for the page to load"),
      navigation_timeout: z
        .number()
        .int()
        .min(5)
        .max(60)
        .optional()
        .describe("Maximum time in seconds for initial page navigation"),
      wait_until: z
        .enum(["load", "domcontentloaded", "networkidle", "commit"])
        .optional()
        .describe("When to consider the page loaded"),

      // Clipping & resizing
      resize_width: z
        .number()
        .int()
        .min(16)
        .max(3840)
        .optional()
        .describe("Resize output image to this width (maintains aspect ratio if only width given)"),
      resize_height: z
        .number()
        .int()
        .min(16)
        .max(2160)
        .optional()
        .describe("Resize output image to this height"),
      clip: z
        .object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          width: z.number().int().min(1).max(3840),
          height: z.number().int().min(1).max(2160),
        })
        .optional()
        .describe("Clip a specific rectangle from the page (x, y, width, height in pixels)"),

      // Advanced
      stealth: z
        .boolean()
        .default(false)
        .describe("Enable stealth mode to avoid bot detection"),
      bypass_csp: z
        .boolean()
        .default(false)
        .describe("Bypass Content Security Policy (allows CSS/JS injection on strict sites)"),
      cache_ttl: z
        .number()
        .int()
        .min(0)
        .max(86400)
        .optional()
        .describe("Cache the screenshot for this many seconds (0 = no cache, max 86400 = 24h)"),
      extract_metadata: z
        .boolean()
        .default(false)
        .describe("Extract page metadata (title, description, OG tags, Twitter Card) alongside the screenshot"),
      certified: z
        .boolean()
        .default(false)
        .describe("Generate a certified screenshot with SHA-256 hash and timestamp"),

      // Geolocation
      geolocation: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          accuracy: z.number().min(0).optional(),
        })
        .optional()
        .describe("Emulate geolocation (latitude, longitude, optional accuracy in meters)"),
      timezone: z
        .string()
        .max(100)
        .optional()
        .describe("Emulate timezone (e.g. 'America/New_York', 'Europe/London')"),
      proxy: z
        .string()
        .max(2048)
        .optional()
        .describe("HTTP/SOCKS proxy URL for the request"),

      // PDF options
      pdf_landscape: z
        .boolean()
        .default(false)
        .describe("PDF in landscape orientation (only when format=pdf)"),
      pdf_page_format: z
        .enum(["A3", "A4", "A5", "Letter", "Legal", "Tabloid"])
        .optional()
        .describe("PDF page size format"),
      pdf_margin_top: z
        .string()
        .max(20)
        .optional()
        .describe("PDF top margin (e.g. '1cm', '0.5in')"),
      pdf_margin_right: z
        .string()
        .max(20)
        .optional()
        .describe("PDF right margin"),
      pdf_margin_bottom: z
        .string()
        .max(20)
        .optional()
        .describe("PDF bottom margin"),
      pdf_margin_left: z
        .string()
        .max(20)
        .optional()
        .describe("PDF left margin"),

      // Video (scroll recording)
      scroll_video: z
        .boolean()
        .default(false)
        .describe("Record a scrolling video of the page instead of a static screenshot"),
      scroll_duration: z
        .number()
        .int()
        .min(2)
        .max(30)
        .optional()
        .describe("Duration of scroll video in seconds (2-30)"),
      scroll_speed: z
        .enum(["slow", "medium", "fast"])
        .optional()
        .describe("Speed of scroll video"),
    },
    async (params) => {
      try {
        // Validate that at least one source is provided
        if (!params.url && !params.html && !params.markdown) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: You must provide one of: url, html, or markdown",
              },
            ],
          };
        }

        if (params.url && !/^https?:\/\//i.test(params.url)) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: URL must start with http:// or https://",
              },
            ],
          };
        }

        const result = await takeScreenshot(params);

        const content: Array<{ type: "image" | "text"; data?: string; mimeType?: string; text?: string }> = [
          {
            type: "image" as const,
            data: result.image_base64,
            mimeType: `image/${result.format === "pdf" ? "png" : result.format}`,
          },
          {
            type: "text" as const,
            text: [
              `Screenshot captured successfully.`,
              `URL: ${result.url}`,
              `Format: ${result.format}`,
              `Dimensions: ${result.width}\u00D7${result.height}`,
              `File size: ${(result.file_size / 1024).toFixed(1)} KB`,
              `Processing time: ${result.processing_time_ms} ms`,
            ].join("\n"),
          },
        ];

        // Include metadata if extracted
        if (result.metadata) {
          const m = result.metadata;
          const metaLines: string[] = ["\nPage Metadata:", `━━━━━━━━━━━━━━`];
          if (m.title) metaLines.push(`Title: ${m.title}`);
          if (m.description) metaLines.push(`Description: ${m.description}`);
          if (m.favicon) metaLines.push(`Favicon: ${m.favicon}`);
          if (m.http_status) metaLines.push(`HTTP Status: ${m.http_status}`);
          if (m.og?.title || m.og?.description || m.og?.image) {
            metaLines.push(`\nOpen Graph:`);
            if (m.og.title) metaLines.push(`  og:title: ${m.og.title}`);
            if (m.og.description) metaLines.push(`  og:description: ${m.og.description}`);
            if (m.og.image) metaLines.push(`  og:image: ${m.og.image}`);
            if (m.og.type) metaLines.push(`  og:type: ${m.og.type}`);
            if (m.og.site_name) metaLines.push(`  og:site_name: ${m.og.site_name}`);
          }
          if (m.twitter?.card || m.twitter?.title) {
            metaLines.push(`\nTwitter Card:`);
            if (m.twitter.card) metaLines.push(`  twitter:card: ${m.twitter.card}`);
            if (m.twitter.title) metaLines.push(`  twitter:title: ${m.twitter.title}`);
            if (m.twitter.description) metaLines.push(`  twitter:description: ${m.twitter.description}`);
            if (m.twitter.image) metaLines.push(`  twitter:image: ${m.twitter.image}`);
          }
          content.push({
            type: "text" as const,
            text: metaLines.join("\n"),
          });
        }

        return { content };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // --- extract_content ---
  server.tool(
    "extract_content",
    "Extract page metadata from any URL without downloading the full screenshot image. Returns the page title, description, Open Graph tags, Twitter Card tags, favicon URL, and HTTP status. Useful for SEO audits, content analysis, and link previews. Costs one screenshot credit.",
    {
      url: z
        .string()
        .url()
        .describe("URL of the page to extract metadata from"),
    },
    async (params) => {
      try {
        if (!/^https?:\/\//i.test(params.url)) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: URL must start with http:// or https://",
              },
            ],
          };
        }

        // Take a minimal screenshot with metadata extraction enabled
        const result = await takeScreenshot({
          url: params.url,
          extract_metadata: true,
          format: "jpeg",
          quality: 10,
          width: 800,
          height: 600,
        });

        if (!result.metadata) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Metadata extraction completed for ${params.url}, but no metadata was returned. The page may be empty or block metadata extraction.`,
              },
            ],
          };
        }

        const m = result.metadata;
        const lines: string[] = [
          `Page Metadata for ${params.url}`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ];

        if (m.http_status) lines.push(`HTTP Status: ${m.http_status}`);
        if (m.title) lines.push(`Title: ${m.title}`);
        if (m.description) lines.push(`Description: ${m.description}`);
        if (m.favicon) lines.push(`Favicon: ${m.favicon}`);

        if (m.og && (m.og.title || m.og.description || m.og.image)) {
          lines.push(`\nOpen Graph:`);
          if (m.og.title) lines.push(`  og:title: ${m.og.title}`);
          if (m.og.description) lines.push(`  og:description: ${m.og.description}`);
          if (m.og.image) lines.push(`  og:image: ${m.og.image}`);
          if (m.og.url) lines.push(`  og:url: ${m.og.url}`);
          if (m.og.type) lines.push(`  og:type: ${m.og.type}`);
          if (m.og.site_name) lines.push(`  og:site_name: ${m.og.site_name}`);
        }

        if (m.twitter && (m.twitter.card || m.twitter.title)) {
          lines.push(`\nTwitter Card:`);
          if (m.twitter.card) lines.push(`  twitter:card: ${m.twitter.card}`);
          if (m.twitter.title) lines.push(`  twitter:title: ${m.twitter.title}`);
          if (m.twitter.description) lines.push(`  twitter:description: ${m.twitter.description}`);
          if (m.twitter.image) lines.push(`  twitter:image: ${m.twitter.image}`);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: lines.join("\n"),
            },
          ],
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // --- check_usage ---
  server.tool(
    "check_usage",
    "Check your ScreenshotRun API usage for the current billing period. Shows screenshots used, remaining, and limits.",
    {},
    async () => {
      try {
        const usage = await checkUsage();

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `ScreenshotRun API Usage`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `Screenshots used: ${usage.screenshots_used} / ${usage.screenshots_limit}`,
                `Screenshots remaining: ${usage.screenshots_remaining}`,
                `Usage: ${usage.usage_percentage.toFixed(1)}%`,
                `Period: ${usage.period_start.split("T")[0]} \u2192 ${usage.period_end.split("T")[0]}`,
                `Days remaining: ${usage.days_remaining}`,
              ].join("\n"),
            },
          ],
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
