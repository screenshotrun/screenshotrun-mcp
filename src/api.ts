const API_BASE = "https://api.screenshotrun.com/api/v1";
const REQUEST_TIMEOUT = 30_000;
const POLL_INTERVAL = 2_000;
const MAX_POLL_ATTEMPTS = 30;

function getApiKey(): string {
  const key = process.env.SCREENSHOTRUN_API_KEY;
  if (!key) {
    throw new Error(
      "SCREENSHOTRUN_API_KEY environment variable is not set. " +
        "Get your free API key at https://screenshotrun.com"
    );
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers(), ...(options.headers as Record<string, string>) },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message =
        body?.error?.message ?? `API returned ${res.status} ${res.statusText}`;
      const code = body?.error?.code ?? "UNKNOWN_ERROR";
      throw new Error(`[${code}] ${message}`);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "Request timed out after 30 seconds. The page may be too heavy or the API is slow. Try again or use a simpler URL."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchImageAsBase64(path: string): Promise<string> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        Accept: "*/*",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message =
        body?.error?.message ?? `Failed to download image: ${res.status}`;
      throw new Error(message);
    }

    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Types ---

export interface ScreenshotOptions {
  // Source (one required)
  url?: string;
  html?: string;
  markdown?: string;

  // Output
  format?: string;
  quality?: number;
  response_type?: string;

  // Viewport
  width?: number;
  height?: number;
  full_page?: boolean;
  device?: string;
  retina?: boolean;
  device_scale_factor?: number;

  // Appearance
  dark_mode?: boolean;
  omit_background?: boolean;
  media_type?: string;
  reduced_motion?: boolean;
  disable_animations?: boolean;

  // Blocking
  block_ads?: boolean;
  block_cookies?: boolean;
  block_chats?: boolean;
  block_requests?: string[];
  block_resources?: string[];

  // Interaction
  selector?: string;
  click_selector?: string;
  hover_selector?: string;
  scroll_to?: string;
  hide_selectors?: string[];
  wait_for_selector?: string;

  // Injection
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  user_agent?: string;

  // Timing
  delay?: number;
  timeout?: number;
  navigation_timeout?: number;
  wait_until?: string;

  // Clipping & resizing
  resize_width?: number;
  resize_height?: number;
  clip?: { x: number; y: number; width: number; height: number };

  // Advanced
  stealth?: boolean;
  bypass_csp?: boolean;
  cache_ttl?: number;
  extract_metadata?: boolean;
  certified?: boolean;
  webhook_url?: string;

  // Geolocation
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  timezone?: string;
  proxy?: string;

  // PDF
  pdf_landscape?: boolean;
  pdf_page_format?: string;
  pdf_margin_top?: string;
  pdf_margin_right?: string;
  pdf_margin_bottom?: string;
  pdf_margin_left?: string;

  // Video
  scroll_video?: boolean;
  scroll_duration?: number;
  scroll_speed?: string;
}

interface ScreenshotData {
  id: string;
  status: string;
  url: string;
  options: Record<string, unknown>;
  created_at: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  processing_time_ms?: number;
  completed_at?: string;
  metadata?: PageMetadata;
  error?: { message: string; code: string };
}

export interface PageMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  http_status?: number;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    site_name?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

interface ApiResponse<T> {
  data: T;
}

export interface ScreenshotResult {
  image_base64: string;
  format: string;
  width: number;
  height: number;
  url: string;
  file_size: number;
  processing_time_ms: number;
  metadata?: PageMetadata;
}

export interface UsageResult {
  period_start: string;
  period_end: string;
  screenshots_used: number;
  screenshots_limit: number;
  screenshots_remaining: number;
  usage_percentage: number;
  days_remaining: number;
}

// --- API methods ---

export async function takeScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  // 1. Create screenshot request
  const { data: created } = await request<ApiResponse<ScreenshotData>>(
    "/screenshots",
    {
      method: "POST",
      body: JSON.stringify(options),
    }
  );

  // 2. Poll until completed or failed
  let screenshot = created;
  let attempts = 0;

  while (
    screenshot.status === "pending" ||
    screenshot.status === "processing"
  ) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error(
        "Screenshot is taking too long to process. Please try again later."
      );
    }
    await sleep(POLL_INTERVAL);
    const { data } = await request<ApiResponse<ScreenshotData>>(
      `/screenshots/${screenshot.id}`
    );
    screenshot = data;
    attempts++;
  }

  if (screenshot.status === "failed") {
    const errMsg =
      screenshot.error?.message ?? "Screenshot capture failed for unknown reason";
    throw new Error(`Screenshot failed: ${errMsg}`);
  }

  // 3. Fetch the image as base64
  const image_base64 = await fetchImageAsBase64(
    `/screenshots/${screenshot.id}/image`
  );

  return {
    image_base64,
    format: screenshot.mime_type?.split("/")[1] ?? options.format ?? "png",
    width: screenshot.width ?? options.width ?? 1280,
    height: screenshot.height ?? options.height ?? 800,
    url: screenshot.url,
    file_size: screenshot.file_size ?? 0,
    processing_time_ms: screenshot.processing_time_ms ?? 0,
    metadata: screenshot.metadata,
  };
}

export async function checkUsage(): Promise<UsageResult> {
  const { data } = await request<ApiResponse<UsageResult>>("/account/usage");
  return data;
}

// --- Page Analysis ---

export interface AnalyzeOptions {
  url: string;
  include?: string[];
  visible_only?: boolean;
  scope?: string;
  with_screenshot?: boolean;
  width?: number;
  height?: number;
  device?: string;
  dark_mode?: boolean;
  block_ads?: boolean;
  block_cookies?: boolean;
  block_chats?: boolean;
  delay?: number;
  timeout?: number;
  stealth?: boolean;
  css?: string;
  js?: string;
  hide_selectors?: string[];
  wait_for_selector?: string;
  user_agent?: string;
  proxy?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
}

export interface AnalyzeResult {
  meta: {
    status?: number;
    took?: number;
    screenshot_url?: string | null;
    requests?: number;
    trial?: boolean;
    left?: number;
    tokens?: number;
    bytes?: number;
  };
  result: {
    url?: string;
    page?: {
      title?: string;
      description?: string;
      language?: string;
      viewport?: { width: number; height: number };
    };
    headings?: Array<{ level: number; text: string; rect: number[] }>;
    interactive?: Array<{
      tag: string;
      text?: string;
      href?: string;
      role?: string;
      type?: string;
      rect: number[];
    }>;
    forms?: Array<{
      action?: string;
      method?: string;
      fields?: number;
      rect: number[];
    }>;
    images?: Array<{
      src?: string;
      alt?: string;
      width?: number;
      height?: number;
      rect: number[];
    }>;
    navigation?: Array<{ text?: string; href?: string; rect: number[] }>;
    stats?: Record<string, number>;
  };
}

export async function analyzePage(
  options: AnalyzeOptions
): Promise<AnalyzeResult> {
  const result = await request<AnalyzeResult>("/analyze", {
    method: "POST",
    body: JSON.stringify(options),
  });
  return result;
}
