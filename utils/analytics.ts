type AnalyticsPayload = Record<string, any>

export function track(event: string, payload: AnalyticsPayload = {}) {
  try {
    // Replace with real analytics later
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, payload)
  } catch {}
}

export default { track }