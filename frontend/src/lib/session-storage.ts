/**
 * Utility functions for managing user session data in localStorage
 */

// Keys used for storing session data
const SESSION_KEYS = [
  "currentConversationId",
  "currentLatex", 
  "currentPdf"
] as const;

/**
 * Clear all session-related data from localStorage
 * This should be called on logout and login to prevent data leakage between users
 */
export function clearSessionData(): void {
  SESSION_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Check if there's any existing session data in localStorage
 */
export function hasSessionData(): boolean {
  return SESSION_KEYS.some(key => localStorage.getItem(key) !== null);
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
}