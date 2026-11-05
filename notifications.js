/**
 * <dcouplr/> Unified Custom Notification Engine & Toast Design System
 * 
 * In-perimeter, Zero-WAN Egress ($0.00), accessible notification bus.
 * Completely eliminates native browser pop-ups (alert/confirm/prompt) with
 * glassmorphic, enterprise-grade toasts, custom modal alerts, and promise-based confirmations.
 */
(function() {
  'use strict';

  // --- Embedded CSS Styles for Universal Injection ---
  const NOTIFICATION_STYLES = `
    /* Toast Container */
    #dcouplr-toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 440px;
      width: calc(100vw - 48px);
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* Individual Toast */
    .dcouplr-toast {
      pointer-events: auto;
      position: relative;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5);
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow: hidden;
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin 0.2s ease;
    }

    .dcouplr-toast.dcouplr-toast-visible {
      transform: translateX(0);
      opacity: 1;
    }

    .dcouplr-toast.dcouplr-toast-hiding {
      transform: translateX(120%);
      opacity: 0;
    }

    /* Toast Header */
    .dcouplr-toast-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .dcouplr-toast-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 0.88rem;
      letter-spacing: 0.01em;
    }

    .dcouplr-toast-icon {
      font-size: 1.1rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dcouplr-toast-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.15rem;
      line-height: 1;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }

    .dcouplr-toast-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Toast Body */
    .dcouplr-toast-body {
      font-size: 0.82rem;
      line-height: 1.45;
      color: #cbd5e1;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .dcouplr-toast-code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.74rem;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 4px;
      max-height: 120px;
      overflow-y: auto;
      color: #38bdf8;
    }

    /* Progress Countdown Bar */
    .dcouplr-toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.3);
      width: 100%;
      transform-origin: left;
      transition: width linear;
    }

    /* Severity Variant Themes */
    .dcouplr-toast-success {
      border-color: rgba(52, 211, 153, 0.45);
      border-left: 4px solid #10b981;
    }
    .dcouplr-toast-success .dcouplr-toast-title-group { color: #34d399; }
    .dcouplr-toast-success .dcouplr-toast-progress { background: #10b981; }

    .dcouplr-toast-error {
      border-color: rgba(244, 63, 94, 0.45);
      border-left: 4px solid #f43f5e;
    }
    .dcouplr-toast-error .dcouplr-toast-title-group { color: #fb7185; }
    .dcouplr-toast-error .dcouplr-toast-progress { background: #f43f5e; }

    .dcouplr-toast-warning {
      border-color: rgba(245, 158, 11, 0.45);
      border-left: 4px solid #f59e0b;
    }
    .dcouplr-toast-warning .dcouplr-toast-title-group { color: #fbbf24; }
    .dcouplr-toast-warning .dcouplr-toast-progress { background: #f59e0b; }

    .dcouplr-toast-info {
      border-color: rgba(56, 189, 248, 0.45);
      border-left: 4px solid #0ea5e9;
    }
    .dcouplr-toast-info .dcouplr-toast-title-group { color: #38bdf8; }
    .dcouplr-toast-info .dcouplr-toast-progress { background: #0ea5e9; }

    .dcouplr-toast-security {
      border-color: rgba(168, 85, 247, 0.45);
      border-left: 4px solid #a855f7;
    }
    .dcouplr-toast-security .dcouplr-toast-title-group { color: #c084fc; }
    .dcouplr-toast-security .dcouplr-toast-progress { background: #a855f7; }

    .dcouplr-toast-dba {
      border-color: rgba(129, 140, 248, 0.45);
      border-left: 4px solid #6366f1;
    }
    .dcouplr-toast-dba .dcouplr-toast-title-group { color: #a5b4fc; }
    .dcouplr-toast-dba .dcouplr-toast-progress { background: #6366f1; }

    /* Custom Modal Overlay */
    .dcouplr-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 18, 0.82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 100010;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.22s ease, visibility 0.22s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .dcouplr-modal-overlay.dcouplr-modal-visible {
      opacity: 1;
      visibility: visible;
    }

    .dcouplr-modal-card {
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
      transform: scale(0.94) translateY(12px);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    .dcouplr-modal-overlay.dcouplr-modal-visible .dcouplr-modal-card {
      transform: scale(1) translateY(0);
    }

    .dcouplr-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(30, 41, 59, 0.35);
    }

    .dcouplr-modal-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dcouplr-modal-icon {
      font-size: 1.35rem;
      line-height: 1;
    }

    .dcouplr-modal-title {
      font-size: 1.02rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .dcouplr-modal-body {
      padding: 20px;
      color: #cbd5e1;
      font-size: 0.88rem;
      line-height: 1.55;
      max-height: 60vh;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .dcouplr-modal-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      background: rgba(30, 41, 59, 0.25);
    }

    .dcouplr-modal-btn {
      padding: 8px 18px;
      font-size: 0.84rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
    }

    .dcouplr-modal-btn:active {
      transform: scale(0.97);
    }

    .dcouplr-modal-btn-primary {
      background: #0ea5e9;
      color: #ffffff;
      border-color: #0284c7;
    }
    .dcouplr-modal-btn-primary:hover {
      background: #0284c7;
    }

    .dcouplr-modal-btn-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.5);
    }
    .dcouplr-modal-btn-danger:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .dcouplr-modal-btn-secondary {
      background: rgba(51, 65, 85, 0.5);
      color: #94a3b8;
      border-color: rgba(148, 163, 184, 0.25);
    }
    .dcouplr-modal-btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      color: #ffffff;
    }
  `;

  // --- Inject CSS Stylesheet ---
  function injectStyles() {
    if (document.getElementById('dcouplr-notification-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'dcouplr-notification-styles';
    styleEl.textContent = NOTIFICATION_STYLES;
    document.head.appendChild(styleEl);
  }

  // --- Ensure Containers in DOM ---
  function getToastContainer() {
    let container = document.getElementById('dcouplr-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dcouplr-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'System Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  // --- Notification Icon Mapping ---
  const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    security: '🛡️',
    dba: '🗄️',
    default: '🔔'
  };

  const DEFAULT_TITLES = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Notice',
    security: 'Security Alert',
    dba: 'DBA Notification',
    default: 'Notification'
  };

  // --- Authoritative Notification Registry Dictionary ---
  const NOTIFICATION_REGISTRY = [
    {
      id: 'NOTIF-DBA-BACKUP-OK',
      name: 'Hot Snapshot Created',
      type: 'toast',
      severity: 'SUCCESS',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'On successful creation of an atomic hot snapshot via VACUUM INTO',
      duration: '4500ms',
      code: "dcouplrNotify.success('Snapshot created: backup_20261104.db (0.27 MB)', 'Backup Archived');"
    },
    {
      id: 'NOTIF-DBA-BACKUP-FAIL',
      name: 'Hot Snapshot Failed',
      type: 'custom_alert',
      severity: 'DANGER_ERROR',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'When hot snapshot generation encounters disk I/O or cipher lock errors',
      duration: 'User Acknowledge Required',
      code: "dcouplrNotify.alert('Failed to create snapshot: disk quota exceeded.', { title: 'Backup Error', type: 'error' });"
    },
    {
      id: 'NOTIF-DBA-RESTORE-CONFIRM',
      name: 'Database Restore Confirmation',
      type: 'custom_confirm',
      severity: 'WARNING',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'Before overwriting the active SQLite database with a verified snapshot',
      duration: 'Interactive Choice',
      code: "const confirmed = await dcouplrNotify.confirm('Overwriting active database with snapshot. Pre-restore safety copy will be archived.', { title: 'Confirm Database Restore', confirmText: 'Proceed with Restore', isDangerous: true });"
    },
    {
      id: 'NOTIF-DBA-RESTORE-OK',
      name: 'Database Restored Successfully',
      type: 'custom_alert',
      severity: 'SUCCESS',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'After hot restore successfully re-keys and re-initializes memory SSOT',
      duration: 'User Acknowledge Required',
      code: "dcouplrNotify.alert('Database restored from backup_20261104.db. Active census: 75 nodes across 5 VPCs.', { title: 'Restore Complete', type: 'success' });"
    },
    {
      id: 'NOTIF-DBA-SCHEDULE-OK',
      name: 'Automated Backup Schedule Created',
      type: 'toast',
      severity: 'SUCCESS',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'When an administrator saves a cron-based automated backup schedule',
      duration: '4000ms',
      code: "dcouplrNotify.success('Scheduled Daily Backup (0 2 * * *) saved with retention 7.', 'Schedule Configured');"
    },
    {
      id: 'NOTIF-DBA-SCHEDULE-EXEC',
      name: 'Automated Schedule On-Demand Run',
      type: 'toast',
      severity: 'INFO',
      category: 'DBA Administration',
      module: 'DBA Desk / Maintenance Studio',
      trigger: 'When an administrator executes an on-demand trigger of a backup schedule',
      duration: '4000ms',
      code: "dcouplrNotify.info('Schedule Daily Backup executed: 0.27 MB snapshot archived.', 'Schedule Triggered');"
    },
    {
      id: 'NOTIF-GUARDRAIL-MUTATION-BLOCKED',
      name: 'Guardrail Mutation Blocked (HTTP 403)',
      type: 'custom_alert',
      severity: 'DANGER_ERROR',
      category: 'Security & Governance',
      module: 'DBA Desk / SQL Console',
      trigger: 'When a DDL/DML statement (DROP, ALTER, CREATE) is attempted in In-VPC Read-Only mode',
      duration: 'User Acknowledge Required',
      code: "dcouplrNotify.alert('HTTP 403 Forbidden: In-VPC mode is strictly read-only ($0.00 WAN Egress). Guardrails can only be disabled via Outside-VPC Hub after Company Access.', { title: 'Guardrail Enforcement', type: 'error' });"
    },
    {
      id: 'NOTIF-GUARDRAIL-UNLOCKED',
      name: 'Break-Glass Override Enabled',
      type: 'toast',
      severity: 'SECURITY_CRITICAL',
      category: 'Security & Governance',
      module: 'Outside-VPC DBA Hub',
      trigger: 'When authorized DBA verifies Company Access and disables read-only protection',
      duration: '6000ms',
      code: "dcouplrNotify.security('Guardrail disabled by alex.turner. Automatic safety backup archived prior to mutations.', 'Break-Glass Active');"
    },
    {
      id: 'NOTIF-SSOT-INTEGRITY-OK',
      name: 'Deep PRAGMA Integrity Verified',
      type: 'toast',
      severity: 'SUCCESS',
      category: 'Database Telemetry',
      module: 'DBA Desk / Company Admin',
      trigger: 'When PRAGMA integrity_check returns ok with 0 corrupt pages',
      duration: '3500ms',
      code: "dcouplrNotify.success('PRAGMA integrity_check passed: 0 corrupt pages. WAL mode verified.', 'SSOT Integrity OK');"
    },
    {
      id: 'NOTIF-COMPANY-ACCESS-VERIFIED',
      name: 'Active Directory Authentication Success',
      type: 'toast',
      severity: 'SUCCESS',
      category: 'Authentication & RBAC',
      module: 'Company Access Gate',
      trigger: 'When a user in Database Administrators group verifies corporate credentials',
      duration: '4000ms',
      code: "dcouplrNotify.success('Corporate Company Access verified for alex.turner (Obs-DBA).', 'Authentication Verified');"
    },
    {
      id: 'NOTIF-COMPANY-ACCESS-LOCKED',
      name: 'DBA Session Locked',
      type: 'toast',
      severity: 'WARNING',
      category: 'Authentication & RBAC',
      module: 'Top Navigation Lock',
      trigger: 'When DBA clicks Lock button: revokes credentials and enforces read-only guardrail',
      duration: '3000ms',
      code: "dcouplrNotify.warning('DBA session locked. Read-only guardrail re-enforced.', 'Session Locked');"
    },
    {
      id: 'NOTIF-LICENSE-QUOTA-WARNING',
      name: 'Node Census Quota Warning',
      type: 'toast',
      severity: 'WARNING',
      category: 'Licensing & Reconciliation',
      module: 'Company Admin / Licensing Desk',
      trigger: 'When active monitored nodes exceed 90% of contracted enterprise quota',
      duration: '5000ms',
      code: "dcouplrNotify.warning('Monitored nodes (92/100) exceeding 90% contracted quota.', 'Quota Alert');"
    },
    {
      id: 'NOTIF-SQLCIPHER-REKEY-OK',
      name: 'Master Encryption Key Rotated',
      type: 'custom_alert',
      severity: 'SUCCESS',
      category: 'Cryptographic Security',
      module: 'Platform Owner Vault (/admin)',
      trigger: 'When SQLCipher 4.x transparent re-key succeeds via PRAGMA rekey',
      duration: 'User Acknowledge Required',
      code: "dcouplrNotify.alert('SQLCipher master key rotated. PBKDF2-HMAC-SHA512 (256,000 iters) verified.', { title: 'Encryption Key Rotated', type: 'success' });"
    },
    {
      id: 'NOTIF-CENTRAL-EXPORT-UNENCRYPTED',
      name: 'Unencrypted Database Copy Exported',
      type: 'custom_alert',
      severity: 'WARNING',
      category: 'Compliance & Export',
      module: 'Platform Owner Vault (/admin)',
      trigger: 'When an administrator exports a decrypted plaintext copy of the central database',
      duration: 'User Acknowledge Required',
      code: "dcouplrNotify.alert('Unencrypted database copy exported to data/exports/dcouplr_central_unencrypted.db. Handle securely.', { title: 'Plaintext Export Created', type: 'warning' });"
    }
  ];

  // --- Main Notification Engine Object ---
  const dcouplrNotify = {
    /**
     * Display an animated floating toast notification.
     */
    toast: function(message, type = 'info', options = {}) {
      injectStyles();
      const container = getToastContainer();

      const normalizedType = ['success', 'error', 'warning', 'info', 'security', 'dba'].includes(type) ? type : 'info';
      const title = options.title || DEFAULT_TITLES[normalizedType] || 'Notification';
      const icon = options.icon || ICONS[normalizedType] || '🔔';
      const duration = typeof options.duration === 'number' ? options.duration : 4000;
      const codeSnippet = options.code || null;

      const toastEl = document.createElement('div');
      toastEl.className = `dcouplr-toast dcouplr-toast-${normalizedType}`;
      toastEl.setAttribute('role', 'alert');

      let bodyHtml = `<div class="dcouplr-toast-body">${escapeHtml(message)}</div>`;
      if (codeSnippet) {
        bodyHtml += `<div class="dcouplr-toast-code">${escapeHtml(codeSnippet)}</div>`;
      }

      toastEl.innerHTML = `
        <div class="dcouplr-toast-header">
          <div class="dcouplr-toast-title-group">
            <span class="dcouplr-toast-icon">${icon}</span>
            <span>${escapeHtml(title)}</span>
          </div>
          <button type="button" class="dcouplr-toast-close" aria-label="Close notification">&times;</button>
        </div>
        ${bodyHtml}
        ${duration > 0 ? '<div class="dcouplr-toast-progress"></div>' : ''}
      `;

      container.appendChild(toastEl);

      // Trigger slide-in animation
      requestAnimationFrame(() => {
        toastEl.classList.add('dcouplr-toast-visible');
      });

      // Timer & progress handling
      let timer = null;
      let startTime = Date.now();
      let remaining = duration;
      const progressBar = toastEl.querySelector('.dcouplr-toast-progress');

      function startTimer() {
        if (duration <= 0) return;
        startTime = Date.now();
        if (progressBar) {
          progressBar.style.transition = `width ${remaining}ms linear`;
          progressBar.style.width = '0%';
        }
        timer = setTimeout(() => dismiss(), remaining);
      }

      function pauseTimer() {
        if (duration <= 0) return;
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        remaining = Math.max(0, remaining - elapsed);
        if (progressBar) {
          const pct = (remaining / duration) * 100;
          progressBar.style.transition = 'none';
          progressBar.style.width = `${pct}%`;
        }
      }

      function dismiss() {
        clearTimeout(timer);
        toastEl.classList.remove('dcouplr-toast-visible');
        toastEl.classList.add('dcouplr-toast-hiding');
        setTimeout(() => {
          if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
          }
        }, 300);
      }

      toastEl.querySelector('.dcouplr-toast-close').addEventListener('click', dismiss);
      toastEl.addEventListener('mouseenter', pauseTimer);
      toastEl.addEventListener('mouseleave', startTimer);

      startTimer();
      return { dismiss };
    },

    /**
     * Show custom modal alert replacing native window.alert.
     * Returns a Promise that resolves when dismissed.
     */
    alert: function(message, options = {}) {
      injectStyles();
      const title = options.title || 'System Notification';
      const type = options.type || 'info';
      const icon = options.icon || ICONS[type] || '🔔';
      const okText = options.okText || 'OK';

      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dcouplr-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML = `
          <div class="dcouplr-modal-card">
            <div class="dcouplr-modal-header">
              <div class="dcouplr-modal-title-group">
                <span class="dcouplr-modal-icon">${icon}</span>
                <h3 class="dcouplr-modal-title">${escapeHtml(title)}</h3>
              </div>
              <button type="button" class="dcouplr-toast-close" id="dcouplr-alert-close-btn">&times;</button>
            </div>
            <div class="dcouplr-modal-body">${escapeHtml(String(message))}</div>
            <div class="dcouplr-modal-footer">
              <button type="button" class="dcouplr-modal-btn dcouplr-modal-btn-secondary" id="dcouplr-alert-copy-btn">📋 Copy</button>
              <button type="button" class="dcouplr-modal-btn dcouplr-modal-btn-primary" id="dcouplr-alert-ok-btn">${escapeHtml(okText)}</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('dcouplr-modal-visible'));

        function cleanup() {
          overlay.classList.remove('dcouplr-modal-visible');
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            resolve();
          }, 240);
        }

        const okBtn = overlay.querySelector('#dcouplr-alert-ok-btn');
        const closeBtn = overlay.querySelector('#dcouplr-alert-close-btn');
        const copyBtn = overlay.querySelector('#dcouplr-alert-copy-btn');

        okBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);

        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(String(message)).then(() => {
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
          }).catch(() => {});
        });

        // Close on Escape or Enter
        const keyHandler = (e) => {
          if (e.key === 'Escape' || e.key === 'Enter') {
            document.removeEventListener('keydown', keyHandler);
            cleanup();
          }
        };
        document.addEventListener('keydown', keyHandler);

        okBtn.focus();
      });
    },

    /**
     * Show custom modal confirmation replacing native window.confirm.
     * Returns a Promise<boolean>.
     */
    confirm: function(message, options = {}) {
      injectStyles();
      const title = options.title || 'Confirmation Required';
      const confirmText = options.confirmText || 'Confirm';
      const cancelText = options.cancelText || 'Cancel';
      const isDangerous = !!options.isDangerous;
      const icon = options.icon || (isDangerous ? '⚠️' : '❓');

      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dcouplr-modal-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML = `
          <div class="dcouplr-modal-card">
            <div class="dcouplr-modal-header">
              <div class="dcouplr-modal-title-group">
                <span class="dcouplr-modal-icon">${icon}</span>
                <h3 class="dcouplr-modal-title">${escapeHtml(title)}</h3>
              </div>
              <button type="button" class="dcouplr-toast-close" id="dcouplr-confirm-close-btn">&times;</button>
            </div>
            <div class="dcouplr-modal-body">${escapeHtml(String(message))}</div>
            <div class="dcouplr-modal-footer">
              <button type="button" class="dcouplr-modal-btn dcouplr-modal-btn-secondary" id="dcouplr-confirm-cancel-btn">${escapeHtml(cancelText)}</button>
              <button type="button" class="dcouplr-modal-btn ${isDangerous ? 'dcouplr-modal-btn-danger' : 'dcouplr-modal-btn-primary'}" id="dcouplr-confirm-ok-btn">${escapeHtml(confirmText)}</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('dcouplr-modal-visible'));

        function finish(result) {
          overlay.classList.remove('dcouplr-modal-visible');
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            resolve(result);
          }, 240);
        }

        overlay.querySelector('#dcouplr-confirm-ok-btn').addEventListener('click', () => finish(true));
        overlay.querySelector('#dcouplr-confirm-cancel-btn').addEventListener('click', () => finish(false));
        overlay.querySelector('#dcouplr-confirm-close-btn').addEventListener('click', () => finish(false));

        const keyHandler = (e) => {
          if (e.key === 'Escape') {
            document.removeEventListener('keydown', keyHandler);
            finish(false);
          } else if (e.key === 'Enter') {
            document.removeEventListener('keydown', keyHandler);
            finish(true);
          }
        };
        document.addEventListener('keydown', keyHandler);

        overlay.querySelector('#dcouplr-confirm-ok-btn').focus();
      });
    },

    // Convenience Methods
    success: function(msg, title = 'Operation Successful', duration = 4000) {
      return this.toast(msg, 'success', { title, duration });
    },
    error: function(msg, title = 'Error Encountered', duration = 6000) {
      return this.toast(msg, 'error', { title, duration });
    },
    warning: function(msg, title = 'Warning', duration = 5000) {
      return this.toast(msg, 'warning', { title, duration });
    },
    info: function(msg, title = 'Notice', duration = 4000) {
      return this.toast(msg, 'info', { title, duration });
    },
    security: function(msg, title = 'Security Alert', duration = 5500) {
      return this.toast(msg, 'security', { title, duration });
    },
    dba: function(msg, title = 'DBA Telemetry & Storage', duration = 4500) {
      return this.toast(msg, 'dba', { title, duration });
    },

    // Notification Registry Inspector
    getRegistry: function() {
      return NOTIFICATION_REGISTRY;
    }
  };

  // Helper function to escape HTML
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Automatic Native Browser Popup Eradication ---
  // Monkey-patch window.alert to route directly into custom modal alert
  window.originalAlert = window.alert;
  window.alert = function(message) {
    return dcouplrNotify.alert(message, { title: 'System Notification' });
  };

  // Provide global aliases for platform compatibility
  window.dcouplrNotify = dcouplrNotify;
  window.showToast = function(msg, type = 'info') {
    return dcouplrNotify.toast(msg, type);
  };

  // Automatically inject styles as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

})();

