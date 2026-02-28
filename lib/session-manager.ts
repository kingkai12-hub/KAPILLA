/**
 * Session Manager - Handles session timeout and inactivity detection
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export class SessionManager {
  private lastActivity: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private onTimeout: () => void;

  constructor(onTimeout: () => void) {
    this.lastActivity = Date.now();
    this.onTimeout = onTimeout;
  }

  /**
   * Start monitoring session activity
   */
  start() {
    this.updateActivity();
    this.setupActivityListeners();
    this.startInactivityCheck();
  }

  /**
   * Stop monitoring and cleanup
   */
  stop() {
    this.removeActivityListeners();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();

    // Reset timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, SESSION_TIMEOUT);
  }

  /**
   * Check if session is still active
   */
  isActive(): boolean {
    return Date.now() - this.lastActivity < SESSION_TIMEOUT;
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, SESSION_TIMEOUT - elapsed);
  }

  /**
   * Handle session timeout
   */
  private handleTimeout() {
    console.log('Session timeout - logging out user');
    this.stop();
    this.onTimeout();
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = () => {
    this.updateActivity();
  };

  /**
   * Periodically check for inactivity
   */
  private startInactivityCheck() {
    this.checkIntervalId = setInterval(() => {
      if (!this.isActive()) {
        this.handleTimeout();
      }
    }, ACTIVITY_CHECK_INTERVAL);
  }
}

/**
 * Get session expiry time from server
 */
export async function getSessionExpiry(): Promise<number | null> {
  try {
    const res = await fetch('/api/auth/session-expiry', {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return data.expiresAt;
    }
  } catch (error) {
    console.error('Failed to get session expiry:', error);
  }

  return null;
}

/**
 * Clear all session data
 */
export function clearSession() {
  // Clear localStorage
  localStorage.removeItem('kapilla_user');

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear any other app-specific storage
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('kapilla_')) {
      localStorage.removeItem(key);
    }
  });
}
