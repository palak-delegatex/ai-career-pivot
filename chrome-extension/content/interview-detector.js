/**
 * Interview Copilot — Video Call Platform Detector
 *
 * Detects when the user is on a supported video call platform (Zoom, Google Meet, Teams)
 * and injects a floating launcher to open the Interview Copilot.
 */

(function () {
  "use strict";

  const APP_URL = "https://ai-career-pivot.vercel.app";
  const DETECTOR_ID = "aicp-interview-copilot-launcher";

  function detectPlatform() {
    const url = window.location.href;
    const host = window.location.hostname;

    if (host.includes("meet.google.com") && /\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(url)) {
      return { platform: "Google Meet", icon: "🟢" };
    }
    if (host.includes("zoom.us") && (url.includes("/j/") || url.includes("/wc/"))) {
      return { platform: "Zoom", icon: "🔵" };
    }
    if (host.includes("teams.microsoft.com") && url.includes("/meeting")) {
      return { platform: "Microsoft Teams", icon: "🟣" };
    }
    if (host.includes("teams.live.com") && url.includes("/meet/")) {
      return { platform: "Microsoft Teams", icon: "🟣" };
    }
    if (host.includes("webex.com") && (url.includes("/meet/") || url.includes("/join/"))) {
      return { platform: "Webex", icon: "🟠" };
    }
    return null;
  }

  function injectLauncher(platform) {
    if (document.getElementById(DETECTOR_ID)) return;

    const container = document.createElement("div");
    container.id = DETECTOR_ID;
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const badge = document.createElement("div");
    badge.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #059669, #0891b2);
      color: white;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      font-size: 13px;
      font-weight: 600;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
    `;
    badge.innerHTML = `
      <span style="font-size: 16px;">⚡</span>
      <span>Interview Copilot</span>
      <span style="font-size: 10px; opacity: 0.7;">${platform.platform}</span>
    `;

    badge.addEventListener("mouseenter", () => {
      badge.style.transform = "scale(1.03)";
      badge.style.boxShadow = "0 6px 32px rgba(0,0,0,0.5)";
    });
    badge.addEventListener("mouseleave", () => {
      badge.style.transform = "scale(1)";
      badge.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
    });

    badge.addEventListener("click", () => {
      const width = 420;
      const height = 700;
      const left = window.screen.width - width - 40;
      const top = 60;
      window.open(
        `${APP_URL}/interview-copilot`,
        "aicp-copilot",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    });

    const dismiss = document.createElement("button");
    dismiss.textContent = "×";
    dismiss.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #374151;
      color: #9ca3af;
      border: none;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    `;
    dismiss.addEventListener("click", (e) => {
      e.stopPropagation();
      container.remove();
    });

    container.appendChild(badge);
    container.appendChild(dismiss);
    document.body.appendChild(container);
  }

  function notifyServiceWorker(platform) {
    try {
      chrome.runtime.sendMessage({
        type: "INTERVIEW_DETECTED",
        platform: platform.platform,
        url: window.location.href,
        timestamp: Date.now(),
      });
    } catch {
      // Extension context may not be available
    }
  }

  function init() {
    const platform = detectPlatform();
    if (platform) {
      injectLauncher(platform);
      notifyServiceWorker(platform);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      init();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
