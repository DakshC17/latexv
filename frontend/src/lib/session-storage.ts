/**
 * Utility functions for managing user session data in localStorage
 */

// Keys used for storing session data
const SESSION_KEYS = [
  "currentConversationId",
  "currentLatex", 
  "currentPdf"
] as const;

// Additional keys for session management
const SESSION_META_KEYS = [
  "sessionTimestamp",
  "isNewSessionRequested",
  "lastLoginTime"
] as const;

/**
 * Clear all session-related data from localStorage
 * This should be called on logout and login to prevent data leakage between users
 */
export function clearSessionData(): void {
  SESSION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  SESSION_META_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Clear only session content but keep meta information
 * Used when starting a new session intentionally
 */
export function clearSessionContent(): void {
  SESSION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  localStorage.setItem("isNewSessionRequested", "true");
  localStorage.setItem("sessionTimestamp", Date.now().toString());
}

/**
 * Check if there's any existing session data in localStorage
 */
export function hasSessionData(): boolean {
  return SESSION_KEYS.some(key => localStorage.getItem(key) !== null);
}

/**
 * Check if user has requested a new session
 */
export function isNewSessionRequested(): boolean {
  return localStorage.getItem("isNewSessionRequested") === "true";
}

/**
 * Check if this is a fresh login (within last few seconds)
 */
export function isFreshLogin(): boolean {
  const lastLoginTime = localStorage.getItem("lastLoginTime");
  if (!lastLoginTime) return false;
  
  const timeDiff = Date.now() - parseInt(lastLoginTime);
  return timeDiff < 5000; // 5 seconds threshold
}

/**
 * Mark that user has logged in freshly
 */
export function markFreshLogin(): void {
  localStorage.setItem("lastLoginTime", Date.now().toString());
}

/**
 * Clear the new session request flag
 */
export function clearNewSessionRequest(): void {
  localStorage.removeItem("isNewSessionRequested");
}

/**
 * Get all current session data from localStorage
 */
export function getSessionData() {
  return {
    conversationId: localStorage.getItem("currentConversationId"),
    latexCode: localStorage.getItem("currentLatex"),
    pdfUrl: localStorage.getItem("currentPdf")
  };
}

/**
 * Store session data in localStorage
 */
export function setSessionData(data: {
  conversationId?: string;
  latexCode?: string;
  pdfUrl?: string;
}): void {
  if (data.conversationId) {
    localStorage.setItem("currentConversationId", data.conversationId);
  }
  if (data.latexCode) {
    localStorage.setItem("currentLatex", data.latexCode);
  }
  if (data.pdfUrl) {
    localStorage.setItem("currentPdf", data.pdfUrl);
  }
  
  // Update session timestamp
  localStorage.setItem("sessionTimestamp", Date.now().toString());
}

/**
 * Check if session should persist (not a fresh login or new session request)
 */
export function shouldPersistSession(): boolean {
  return !isFreshLogin() && !isNewSessionRequested() && hasSessionData();
}