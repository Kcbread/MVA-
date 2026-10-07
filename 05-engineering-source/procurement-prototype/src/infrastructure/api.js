// infrastructure/api: authoritative source; see docs/module-map.md.


// @legacy-unit 406 2181
export function apiModeEnabled() {
  return window.location.protocol !== "file:";
}
// @end-legacy-unit 406

// @legacy-unit 407 2185
export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `API error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}
// @end-legacy-unit 407

export function replaceApiModeEnabledBinding(value) { apiModeEnabled = value; return value; }

export function replaceApiRequestBinding(value) { apiRequest = value; return value; }
