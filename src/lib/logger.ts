/**
 * Centralized Performance Logging Utility
 * 
 * Provides consistent logging with timestamps for tracking:
 * - Screen navigation, mounting, and focus
 * - Component rendering
 * - WebSocket subscriptions and data
 * - API calls and responses
 */

// Format timestamp as [HH:MM:SS.mmm]
function getTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
}

// Screen Navigation
export function logScreenNavigation(screenName: string): void {
  console.log(`${getTimestamp()} [Navigation] → ${screenName}`);
}

// Screen Lifecycle
export function logScreenMount(screenName: string): void {
  console.log(`${getTimestamp()} [${screenName}] Screen mounted`);
}

export function logScreenUnmount(screenName: string): void {
  console.log(`${getTimestamp()} [${screenName}] Screen unmounted`);
}

export function logScreenFocus(screenName: string): void {
  console.log(`${getTimestamp()} [${screenName}] Screen focused`);
}

export function logScreenBlur(screenName: string): void {
  console.log(`${getTimestamp()} [${screenName}] Screen blurred`);
}

export function logScreenFullyRendered(screenName: string): void {
  console.log(`${getTimestamp()} [${screenName}] Screen fully rendered`);
}

// Component Rendering
export function logRender(componentName: string, details?: string): void {
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [${componentName}] Rendering${detailsStr}`);
}

// WebSocket Operations
export function logWebSocketSubscription(type: string, details?: string): void {
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [WebSocket] Subscribing to ${type}${detailsStr}`);
}

export function logWebSocketUnsubscription(type: string): void {
  console.log(`${getTimestamp()} [WebSocket] Unsubscribed from ${type}`);
}

export function logWebSocketData(type: string, count?: number, details?: string): void {
  const countStr = count !== undefined ? ` - ${count} items` : '';
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [WebSocket] ${type} data received${countStr}${detailsStr}`);
}

export function logWebSocketConnection(status: 'connected' | 'disconnected' | 'error', details?: string): void {
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [WebSocket] ${status}${detailsStr}`);
}

export function logWebSocketMode(mode: string): void {
  console.log(`${getTimestamp()} [WebSocket] Mode: ${mode}`);
}

// API Operations
export function logApiCall(endpoint: string, details?: string): void {
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [API] Calling ${endpoint}${detailsStr}`);
}

export function logApiResponse(endpoint: string, count?: number, details?: string): void {
  const countStr = count !== undefined ? ` - ${count} items` : '';
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [API] ${endpoint} response received${countStr}${detailsStr}`);
}

export function logApiError(endpoint: string, error: any): void {
  console.log(`${getTimestamp()} [API] ${endpoint} error:`, error);
}

// User Actions
export function logUserAction(screenName: string, action: string, details?: string): void {
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${getTimestamp()} [${screenName}] User action: ${action}${detailsStr}`);
}

// Modal Operations
export function logModalOpen(modalName: string): void {
  console.log(`${getTimestamp()} [Modal] ${modalName} opened`);
}

export function logModalClose(modalName: string): void {
  console.log(`${getTimestamp()} [Modal] ${modalName} closed`);
}

// Data Updates
export function logDataUpdate(context: string, description: string): void {
  console.log(`${getTimestamp()} [${context}] ${description}`);
}

// Polling
export function logPollingStart(service: string, interval: number): void {
  console.log(`${getTimestamp()} [${service}] Starting polling - interval: ${interval}ms`);
}

export function logPollingStop(service: string): void {
  console.log(`${getTimestamp()} [${service}] Stopping polling`);
}

export function logPollingCycle(service: string): void {
  console.log(`${getTimestamp()} [${service}] Polling cycle`);
}

