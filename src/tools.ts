import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { takeScreenshot, checkUsage } from "./api.js";

export function registerTools(server: McpServer): void {
  // --- take_screenshot ---
  server.tool(
    "take_screenshot",
    "Capture a screenshot of any webpage. Returns the image as base64-encoded data. Supports custom viewport sizes, device emulation, dark mode, full-page capture, ad blocking, and more.",
    {
      url: z
        .string()
        .url()
        .describe("URL of the page to screenshot (must start with http:// or https://)"),
      format: z
        .enum(["png", "jpeg", "webp", "pdf"])
        .default("png")
        .describe("Output image format"),
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
      quality: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(80)
        .describe("Image quality for JPEG/WebP (1-100)"),
      device: z
        .enum(["desktop", "mobile", "tablet"])
        .optional()
        .describe("Device preset (affects viewport and user agent)"),
      dark_mode: z
        .boolean()
        .default(false)
        .describe("Enable dark mode (prefers-color-scheme: dark)"),
      block_ads: z
        .boolean()
        .default(false)
        .describe("Block advertisements during capture"),
      block_cookies: z
        .boolean()
        .default(true)
        .describe("Block cookie consent dialogs"),
      delay: z
        .number()
        .int()
        .min(0)
        .max(10)
        .default(0)
        .describe("Delay in seconds after page load before capturing"),
      retina: z
        .boolean()
        .default(false)
        .describe("Capture at 2x resolution (retina)"),
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
      selector: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector to capture a specific element instead of the full viewport"),
      hide_selectors: z
        .array(z.string().max(500))
        .max(20)
        .optional()
        .describe("CSS selectors of elements to hide before capture"),
      click_selector: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector of an element to click before capture"),
      scroll_to: z
        .string()
        .max(500)
        .optional()
        .describe("CSS selector of an element to scroll into view before capture"),
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

        const result = await takeScreenshot(params);

        return {
          content: [
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
                `Dimensions: ${result.width}×${result.height}`,
                `File size: ${(result.file_size / 1024).toFixed(1)} KB`,
                `Processing time: ${result.processing_time_ms} ms`,
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
                `Period: ${usage.period_start.split("T")[0]} → ${usage.period_end.split("T")[0]}`,
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
