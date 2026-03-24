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
  url: string;
  format?: string;
  width?: number;
  height?: number;
  full_page?: boolean;
  quality?: number;
  device?: string;
  dark_mode?: boolean;
  block_ads?: boolean;
  block_cookies?: boolean;
  delay?: number;
  retina?: boolean;
  css?: string;
  js?: string;
  selector?: string;
  hide_selectors?: string[];
  click_selector?: string;
  scroll_to?: string;
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
  error?: { message: string; code: string };
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
  };
}

export async function checkUsage(): Promise<UsageResult> {
  const { data } = await request<ApiResponse<UsageResult>>("/account/usage");
  return data;
}
