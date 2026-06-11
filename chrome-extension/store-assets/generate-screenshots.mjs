import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'screenshot-mockups');

const CHROME_FRAME = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1280px; height: 800px; overflow: hidden; background: #1a1a2e; font-family: system-ui, -apple-system, sans-serif; }
  .chrome-frame { display: flex; flex-direction: column; height: 100%; }
  .chrome-titlebar { display: flex; align-items: center; height: 38px; background: #202124; padding: 0 12px; gap: 8px; }
  .chrome-dots { display: flex; gap: 6px; }
  .chrome-dot { width: 12px; height: 12px; border-radius: 50%; }
  .chrome-dot.red { background: #ff5f57; }
  .chrome-dot.yellow { background: #febc2e; }
  .chrome-dot.green { background: #28c840; }
  .chrome-tabs { display: flex; align-items: flex-end; flex: 1; padding-left: 8px; gap: 1px; height: 100%; }
  .chrome-tab { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #292a2d; border-radius: 8px 8px 0 0; color: #e8eaed; font-size: 12px; max-width: 200px; height: 32px; margin-top: auto; }
  .chrome-tab.active { background: #35363a; }
  .chrome-tab-icon { width: 16px; height: 16px; border-radius: 2px; background: #4a9; display: flex; align-items: center; justify-content: center; font-size: 9px; color: white; font-weight: 700; }
  .chrome-toolbar { display: flex; align-items: center; height: 36px; background: #35363a; padding: 0 8px; gap: 6px; }
  .chrome-nav-btn { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9aa0a6; font-size: 16px; }
  .chrome-url-bar { flex: 1; height: 28px; background: #202124; border-radius: 14px; padding: 0 12px; display: flex; align-items: center; color: #bdc1c6; font-size: 13px; gap: 6px; }
  .chrome-url-lock { color: #9aa0a6; font-size: 12px; }
  .chrome-url-text { color: #bdc1c6; }
  .chrome-url-domain { color: #9aa0a6; }
  .chrome-extensions { display: flex; align-items: center; gap: 4px; padding-left: 8px; }
  .chrome-ext-icon { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
  .chrome-ext-icon.active { background: #4a4b4e; }
  .chrome-ext-icon svg { width: 16px; height: 16px; }
  .chrome-content { flex: 1; position: relative; overflow: hidden; }
</style>`;

const POPUP_CSS = `
<style>
  .popup-container { position: absolute; top: 0; right: 100px; width: 360px; background: #0f172a; border-radius: 0 0 12px 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border: 1px solid #334155; border-top: none; z-index: 100; overflow: hidden; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; }
  .popup-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #1e293b; }
  .popup-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; color: #f1f5f9; }
  .popup-view { padding: 12px 16px; }
  .popup-footer { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; }
  .sync-dot { width: 6px; height: 6px; border-radius: 50%; }
  .sync-dot.green { background: #10b981; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 20px; text-align: center; }
  .signin-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-top: 4px; }
  .signin-desc { font-size: 12px; color: #94a3b8; line-height: 1.5; max-width: 260px; }
  .btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; max-width: 280px; padding: 11px 16px; background: #fff; color: #1f2937; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; margin-top: 8px; }
  .signin-hint { font-size: 11px; color: #64748b; margin-top: 4px; }

  .pipeline { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #1e293b; border-radius: 10px; margin-bottom: 16px; }
  .pipeline-stage { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .pipeline-dot { width: 8px; height: 8px; border-radius: 50%; }
  .pipeline-count { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .pipeline-label { font-size: 10px; color: #94a3b8; }
  .pipeline-arrow { color: #475569; font-size: 12px; }
  .bg-slate { background: #94a3b8; } .bg-teal { background: #2dd4bf; } .bg-amber { background: #fbbf24; } .bg-emerald { background: #10b981; }

  .section-title { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .recent-job { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; }
  .recent-job-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: white; flex-shrink: 0; }
  .recent-job-info { flex: 1; min-width: 0; }
  .recent-job-title { font-size: 13px; font-weight: 600; color: #f1f5f9; }
  .recent-job-company { font-size: 11px; color: #94a3b8; }
  .score-ring-mini { width: 32px; height: 32px; flex-shrink: 0; }

  .actions { display: flex; flex-direction: column; gap: 8px; align-items: center; margin-top: 12px; }
  .btn-primary { display: block; width: 100%; padding: 10px; background: #2dd4bf; color: #0f172a; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; }
  .btn-link { background: none; border: none; color: #2dd4bf; font-size: 12px; padding: 4px 0; }

  .job-card { background: #1e293b; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
  .job-card-header { display: flex; gap: 10px; }
  .company-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: white; flex-shrink: 0; }
  .job-title { font-size: 15px; font-weight: 700; color: #f1f5f9; line-height: 1.3; }
  .job-company { font-size: 13px; color: #94a3b8; margin-top: 2px; }
  .job-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 11px; color: #64748b; }
  .source-badge { padding: 1px 6px; border-radius: 8px; background: #334155; color: #94a3b8; font-size: 10px; }

  .score-section { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 12px; }
  .score-metrics { display: flex; gap: 8px; width: 100%; }
  .metric { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px; background: #1e293b; border-radius: 8px; }
  .metric-val { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .metric-label { font-size: 10px; color: #94a3b8; margin-top: 2px; }

  .keyword-details { width: 100%; background: #1e293b; border-radius: 8px; overflow: hidden; }
  .keyword-details summary { padding: 8px 12px; font-size: 12px; font-weight: 600; color: #94a3b8; cursor: pointer; list-style: none; }
  .keyword-list { padding: 0 12px 12px; display: flex; flex-wrap: wrap; gap: 4px; }
  .kw-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; display: inline-block; }
  .kw-exact { background: #064e3b; color: #6ee7b7; }
  .kw-variant { background: #1e3a5f; color: #7dd3fc; }
  .kw-miss { background: #451a03; color: #fbbf24; }

  .resume-bar { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 10px; background: #1e293b; border-radius: 8px; font-size: 12px; }
  .resume-bar-name { color: #e2e8f0; font-weight: 600; flex: 1; }
  .resume-switch-btn { font-size: 11px; color: #2dd4bf; }

  .save-cta { margin-top: 4px; }
  .btn-full { font-size: 15px; padding: 12px; }
  .saved-indicator { display: flex; align-items: center; gap: 8px; padding: 10px; background: #064e3b; border-radius: 8px; color: #6ee7b7; font-weight: 600; font-size: 14px; }
  .stage-badge { margin-left: auto; font-size: 11px; padding: 2px 8px; border-radius: 10px; background: rgba(255,255,255,0.1); }
  .saved-actions { display: flex; justify-content: center; gap: 16px; margin-top: 8px; }

  .user-menu { position: relative; }
  .user-avatar-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #334155; background: #2dd4bf; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .avatar-initial { font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1; }
  .icon-btn { background: none; border: none; color: #94a3b8; padding: 4px; border-radius: 6px; }
  .header-actions { display: flex; align-items: center; gap: 4px; }
</style>`;

const LOGO_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

function scoreRingSVG(score, size = 80, strokeWidth = 6) {
  const r = (size - strokeWidth) / 2;
  const c = Math.PI * 2 * r;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${strokeWidth}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - score/100)}" stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.35em" fill="#f1f5f9" font-size="${size*0.3}" font-weight="700" font-family="system-ui">${score}</text>
  </svg>`;
}

function miniScoreRingSVG(score) {
  return scoreRingSVG(score, 32, 3);
}

function chromeFrame(url, tabTitle, content, opts = {}) {
  const bgPage = opts.bgPage || '';
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
${CHROME_FRAME}
${POPUP_CSS}
<style>
  .page-bg { width: 100%; height: 100%; ${bgPage ? '' : 'background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);'} }
  ${opts.extraCSS || ''}
</style>
</head><body>
<div class="chrome-frame">
  <div class="chrome-titlebar">
    <div class="chrome-dots"><div class="chrome-dot red"></div><div class="chrome-dot yellow"></div><div class="chrome-dot green"></div></div>
    <div class="chrome-tabs">
      <div class="chrome-tab active"><div class="chrome-tab-icon">A</div><span>${tabTitle}</span></div>
    </div>
  </div>
  <div class="chrome-toolbar">
    <div class="chrome-nav-btn">&larr;</div>
    <div class="chrome-nav-btn">&rarr;</div>
    <div class="chrome-nav-btn">&#x21bb;</div>
    <div class="chrome-url-bar">
      <span class="chrome-url-lock">&#x1f512;</span>
      <span class="chrome-url-text">${url}</span>
    </div>
    <div class="chrome-extensions">
      <div class="chrome-ext-icon ${opts.popupOpen ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    </div>
  </div>
  <div class="chrome-content">
    <div class="page-bg">${bgPage}</div>
    ${content}
  </div>
</div>
</body></html>`;
}

function popupFrame(header, body, footer) {
  return `<div class="popup-container">
    <div class="popup-header">
      <div class="popup-logo">${LOGO_SVG}<span>AICareerPivot</span></div>
      ${header}
    </div>
    <div class="popup-view">${body}</div>
    <div class="popup-footer">${footer}</div>
  </div>`;
}

// Screenshot 1: Sign-In View
const ss1 = chromeFrame('linkedin.com/jobs/', 'Jobs | LinkedIn', popupFrame(
  `<div class="header-actions"><div class="icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>`,
  `<div class="empty-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <p class="signin-title">Welcome to AICareerPivot</p>
    <p class="signin-desc">Save jobs, get ATS match scores, and autofill applications.</p>
    <button class="btn-google">
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      <span>Continue with Google</span>
    </button>
    <p class="signin-hint">Uses the same account as your web dashboard</p>
  </div>`,
  `<span class="sync-dot"></span><span>Not signed in</span>`
), { popupOpen: true, bgPage: `<div style="padding: 40px; background: #f0f0f0; height: 100%;"><div style="max-width: 800px; margin: 0 auto;"><div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="display: flex; gap: 16px;"><div style="width: 64px; height: 64px; background: #0077b5; border-radius: 8px;"></div><div><div style="font-size: 20px; font-weight: 700; color: #111;">Senior Product Designer</div><div style="color: #666; margin-top: 4px;">Stripe &middot; San Francisco, CA</div><div style="display: flex; gap: 8px; margin-top: 8px;"><span style="padding: 4px 12px; background: #e8f5e9; color: #2e7d32; border-radius: 16px; font-size: 12px;">Full-time</span><span style="padding: 4px 12px; background: #f3e5f5; color: #7b1fa2; border-radius: 16px; font-size: 12px;">Remote OK</span></div></div></div></div><div style="background: white; border-radius: 12px; padding: 24px; margin-top: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="font-size: 16px; font-weight: 700; color: #111; margin-bottom: 12px;">About the role</div><div style="color: #444; line-height: 1.6; font-size: 14px;">We are looking for a Senior Product Designer to join our design team and help shape the future of financial infrastructure...</div></div></div></div>` });

// Screenshot 2: Dashboard
const ss2 = chromeFrame('linkedin.com/jobs/', 'Jobs | LinkedIn', popupFrame(
  `<div class="header-actions"><div class="user-menu"><div class="user-avatar-btn"><span class="avatar-initial">J</span></div></div><div class="icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>`,
  `<div class="pipeline">
    <div class="pipeline-stage"><span class="pipeline-dot bg-slate"></span><span class="pipeline-count">12</span><span class="pipeline-label">Saved</span></div>
    <div class="pipeline-arrow">&rarr;</div>
    <div class="pipeline-stage"><span class="pipeline-dot bg-teal"></span><span class="pipeline-count">5</span><span class="pipeline-label">Applied</span></div>
    <div class="pipeline-arrow">&rarr;</div>
    <div class="pipeline-stage"><span class="pipeline-dot bg-amber"></span><span class="pipeline-count">2</span><span class="pipeline-label">Interview</span></div>
    <div class="pipeline-arrow">&rarr;</div>
    <div class="pipeline-stage"><span class="pipeline-dot bg-emerald"></span><span class="pipeline-count">1</span><span class="pipeline-label">Offer</span></div>
  </div>
  <div class="section-title">Recent Saves</div>
  <div>
    <div class="recent-job"><div class="recent-job-icon" style="background:#6366f1">S</div><div class="recent-job-info"><div class="recent-job-title">Senior Product Designer</div><div class="recent-job-company">Stripe</div></div><div class="score-ring-mini">${miniScoreRingSVG(82)}</div></div>
    <div class="recent-job"><div class="recent-job-icon" style="background:#f59e0b">N</div><div class="recent-job-info"><div class="recent-job-title">Staff UX Engineer</div><div class="recent-job-company">Notion</div></div><div class="score-ring-mini">${miniScoreRingSVG(71)}</div></div>
    <div class="recent-job"><div class="recent-job-icon" style="background:#10b981">V</div><div class="recent-job-info"><div class="recent-job-title">Design Systems Lead</div><div class="recent-job-company">Vercel</div></div><div class="score-ring-mini">${miniScoreRingSVG(65)}</div></div>
  </div>
  <div class="actions"><button class="btn-primary">Paste Job URL</button><button class="btn-link">Open Dashboard &rarr;</button></div>`,
  `<span class="sync-dot green"></span><span>Synced</span>`
), { popupOpen: true, bgPage: `<div style="padding: 40px; background: #f0f0f0; height: 100%;"><div style="max-width: 800px; margin: 0 auto;"><div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 16px;">Recommended for you</div><div style="display: flex; flex-direction: column; gap: 12px;"><div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;"><div style="font-weight: 600; color: #111;">ML Engineer</div><div style="color: #666; font-size: 13px;">OpenAI &middot; San Francisco</div></div><div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;"><div style="font-weight: 600; color: #111;">Product Manager, AI</div><div style="color: #666; font-size: 13px;">Anthropic &middot; Remote</div></div></div></div></div></div>` });

// Screenshot 3: ATS Score
const ss3 = chromeFrame('linkedin.com/jobs/view/senior-product-designer-at-stripe', 'Senior Product Designer - Stripe | LinkedIn', popupFrame(
  `<div class="header-actions"><div class="user-menu"><div class="user-avatar-btn"><span class="avatar-initial">J</span></div></div><div class="icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>`,
  `<div class="job-card"><div class="job-card-header"><div class="company-icon" style="background:#6366f1">S</div><div><div class="job-title">Senior Product Designer</div><div class="job-company">Stripe</div><div class="job-meta"><span>San Francisco, CA</span><span>$180k-$240k</span><span class="source-badge">LinkedIn</span></div></div></div></div>
  <div class="score-section">
    <div class="resume-bar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="resume-bar-name">AI Product Design Resume</span><span class="resume-switch-btn">Switch</span></div>
    ${scoreRingSVG(82)}
    <div class="score-metrics"><div class="metric"><span class="metric-val">14</span><span class="metric-label">Exact</span></div><div class="metric"><span class="metric-val">6</span><span class="metric-label">Variant</span></div><div class="metric"><span class="metric-val">4</span><span class="metric-label">Semantic</span></div><div class="metric"><span class="metric-val">3</span><span class="metric-label">Missing</span></div></div>
    <div class="keyword-details"><summary>&#9656; Keyword Breakdown</summary></div>
  </div>
  <div class="save-cta"><button class="btn-primary btn-full">Save & Track</button></div>`,
  `<span class="sync-dot green"></span><span>Synced</span>`
), { popupOpen: true, bgPage: `<div style="padding: 40px; background: #f0f0f0; height: 100%;"><div style="max-width: 800px; margin: 0 auto;"><div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="display: flex; gap: 16px;"><div style="width: 64px; height: 64px; background: #6366f1; border-radius: 8px;"></div><div><div style="font-size: 20px; font-weight: 700; color: #111;">Senior Product Designer</div><div style="color: #666; margin-top: 4px;">Stripe &middot; San Francisco, CA</div></div></div></div></div></div>` });

// Screenshot 4: Keywords Expanded
const ss4 = chromeFrame('linkedin.com/jobs/view/senior-product-designer-at-stripe', 'Senior Product Designer - Stripe | LinkedIn', popupFrame(
  `<div class="header-actions"><div class="user-menu"><div class="user-avatar-btn"><span class="avatar-initial">J</span></div></div><div class="icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>`,
  `<div class="job-card"><div class="job-card-header"><div class="company-icon" style="background:#6366f1">S</div><div><div class="job-title">Senior Product Designer</div><div class="job-company">Stripe</div><div class="job-meta"><span>San Francisco, CA</span><span class="source-badge">LinkedIn</span></div></div></div></div>
  <div class="score-section">
    ${scoreRingSVG(82, 64, 5)}
    <div class="score-metrics"><div class="metric"><span class="metric-val">14</span><span class="metric-label">Exact</span></div><div class="metric"><span class="metric-val">6</span><span class="metric-label">Variant</span></div><div class="metric"><span class="metric-val">4</span><span class="metric-label">Semantic</span></div><div class="metric"><span class="metric-val">3</span><span class="metric-label">Missing</span></div></div>
    <div class="keyword-details" open>
      <summary>&#9662; Keyword Breakdown</summary>
      <div class="keyword-list">
        <span class="kw-tag kw-exact">Figma</span>
        <span class="kw-tag kw-exact">Design Systems</span>
        <span class="kw-tag kw-exact">Prototyping</span>
        <span class="kw-tag kw-exact">User Research</span>
        <span class="kw-tag kw-exact">A/B Testing</span>
        <span class="kw-tag kw-exact">Responsive Design</span>
        <span class="kw-tag kw-variant">UI/UX</span>
        <span class="kw-tag kw-variant">JavaScript</span>
        <span class="kw-tag kw-variant">React</span>
        <span class="kw-tag kw-miss">Stripe API</span>
        <span class="kw-tag kw-miss">FinTech</span>
        <span class="kw-tag kw-miss">Payments</span>
      </div>
    </div>
  </div>
  <div class="save-cta"><button class="btn-primary btn-full">Save & Track</button></div>`,
  `<span class="sync-dot green"></span><span>Synced</span>`
), { popupOpen: true, bgPage: `<div style="padding: 40px; background: #f0f0f0; height: 100%;"><div style="max-width: 800px; margin: 0 auto;"><div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="display: flex; gap: 16px;"><div style="width: 64px; height: 64px; background: #6366f1; border-radius: 8px;"></div><div><div style="font-size: 20px; font-weight: 700; color: #111;">Senior Product Designer</div><div style="color: #666; margin-top: 4px;">Stripe &middot; San Francisco, CA</div></div></div></div></div></div>` });

// Screenshot 5: Saved Confirmation
const ss5 = chromeFrame('linkedin.com/jobs/view/senior-product-designer-at-stripe', 'Senior Product Designer - Stripe | LinkedIn', popupFrame(
  `<div class="header-actions"><div class="user-menu"><div class="user-avatar-btn"><span class="avatar-initial">J</span></div></div><div class="icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div></div>`,
  `<div class="job-card"><div class="job-card-header"><div class="company-icon" style="background:#6366f1">S</div><div><div class="job-title">Senior Product Designer</div><div class="job-company">Stripe</div><div class="job-meta"><span>San Francisco, CA</span><span>$180k-$240k</span><span class="source-badge">LinkedIn</span></div></div></div></div>
  <div class="score-section">
    ${scoreRingSVG(82)}
    <div class="score-metrics"><div class="metric"><span class="metric-val">14</span><span class="metric-label">Exact</span></div><div class="metric"><span class="metric-val">6</span><span class="metric-label">Variant</span></div><div class="metric"><span class="metric-val">4</span><span class="metric-label">Semantic</span></div><div class="metric"><span class="metric-val">3</span><span class="metric-label">Missing</span></div></div>
  </div>
  <div class="save-cta">
    <div class="saved-indicator">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>Saved</span>
      <span class="stage-badge">Saved</span>
    </div>
    <div class="saved-actions"><button class="btn-link">View in Tracker</button><button class="btn-link">Re-score</button></div>
  </div>`,
  `<span class="sync-dot green"></span><span>Synced</span>`
), { popupOpen: true, bgPage: `<div style="padding: 40px; background: #f0f0f0; height: 100%;"><div style="max-width: 800px; margin: 0 auto;"><div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="display: flex; gap: 16px;"><div style="width: 64px; height: 64px; background: #6366f1; border-radius: 8px;"></div><div><div style="font-size: 20px; font-weight: 700; color: #111;">Senior Product Designer</div><div style="color: #666; margin-top: 4px;">Stripe &middot; San Francisco, CA</div></div></div></div></div></div>` });

// Screenshot 6: In-page save button + score overlay on LinkedIn
const ss6Content = `
<style>
  .linkedin-page { font-family: system-ui, -apple-system, sans-serif; background: #f4f2ee; height: 100%; padding: 20px; display: flex; gap: 20px; justify-content: center; }
  .linkedin-sidebar { width: 240px; background: white; border-radius: 8px; height: 280px; padding: 20px; border: 1px solid #ddd; }
  .linkedin-main { width: 640px; }
  .linkedin-card { background: white; border-radius: 8px; padding: 24px; border: 1px solid #ddd; margin-bottom: 8px; }
  .linkedin-job-header { display: flex; gap: 16px; margin-bottom: 16px; }
  .linkedin-logo { width: 56px; height: 56px; background: #6366f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
  .linkedin-title { font-size: 22px; font-weight: 700; color: #111; }
  .linkedin-company { color: #0077b5; font-size: 15px; margin-top: 2px; }
  .linkedin-loc { color: #666; font-size: 13px; margin-top: 4px; }
  .linkedin-actions { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
  .linkedin-btn-apply { padding: 8px 24px; background: #0077b5; color: white; border: none; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .linkedin-btn-save { padding: 8px 24px; border: 1px solid #0077b5; color: #0077b5; background: white; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .acp-save-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; margin: 0 8px; background: #0f172a; color: #2dd4bf; border: 1px solid #334155; border-radius: 20px; font-family: system-ui; font-size: 13px; font-weight: 600; cursor: pointer; }
  .acp-mini-score { font-weight: 700; margin-left: 4px; }
  .acp-score-panel { position: fixed; top: 80px; right: 20px; width: 320px; background: rgba(15,23,42,0.95); border: 1px solid #334155; border-radius: 12px; padding: 16px; font-family: system-ui; color: #e2e8f0; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 100; }
  .acp-score-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .acp-score-label { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 2px; }
  .acp-score-detail { font-size: 12px; color: #94a3b8; }
  .acp-score-metrics { display: flex; gap: 8px; margin-bottom: 12px; }
  .acp-metric { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px; background: #1e293b; border-radius: 8px; }
  .acp-metric-val { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .acp-metric-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .acp-keywords { margin-top: 8px; }
  .acp-kw-title { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .acp-kw-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .acp-kw-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .acp-kw-exact { background: #064e3b; color: #6ee7b7; }
  .acp-kw-variant { background: #1e3a5f; color: #7dd3fc; }
  .acp-kw-miss { background: #451a03; color: #fbbf24; }
  .acp-panel-close { position: absolute; top: 8px; right: 12px; background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; font-family: system-ui; }
  .linkedin-desc { color: #333; font-size: 14px; line-height: 1.6; }
  .linkedin-sidebar-title { font-weight: 600; color: #111; margin-bottom: 8px; font-size: 15px; }
  .linkedin-sidebar-item { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; color: #666; }
</style>
<div class="linkedin-page">
  <div class="linkedin-sidebar">
    <div class="linkedin-sidebar-title">Similar jobs</div>
    <div class="linkedin-sidebar-item">UX Designer &middot; Google</div>
    <div class="linkedin-sidebar-item">Product Designer &middot; Meta</div>
    <div class="linkedin-sidebar-item">Design Lead &middot; Figma</div>
    <div class="linkedin-sidebar-item">Sr. Designer &middot; Canva</div>
  </div>
  <div class="linkedin-main">
    <div class="linkedin-card">
      <div class="linkedin-job-header">
        <div class="linkedin-logo">S</div>
        <div>
          <div class="linkedin-title">Senior Product Designer</div>
          <div class="linkedin-company">Stripe</div>
          <div class="linkedin-loc">San Francisco, CA &middot; Full-time &middot; $180k-$240k/yr</div>
        </div>
      </div>
      <div class="linkedin-actions">
        <button class="linkedin-btn-apply">&#9889; Easy Apply</button>
        <button class="linkedin-btn-save">Save</button>
        <div class="acp-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Save & Score<span class="acp-mini-score">82</span>
        </div>
      </div>
    </div>
    <div class="linkedin-card">
      <div class="linkedin-desc"><strong>About the role</strong><br><br>We are looking for a Senior Product Designer to join our design team. You will work on defining and building the future of financial infrastructure products used by millions of businesses worldwide...</div>
    </div>
  </div>
  <div class="acp-score-panel">
    <button class="acp-panel-close">&times;</button>
    <div class="acp-score-header">
      <div>${scoreRingSVG(82, 56, 4)}</div>
      <div><div class="acp-score-label">ATS Match Score</div><div class="acp-score-detail">AI Product Design Resume</div></div>
    </div>
    <div class="acp-score-metrics">
      <div class="acp-metric"><span class="acp-metric-val">14</span><span class="acp-metric-label">Exact</span></div>
      <div class="acp-metric"><span class="acp-metric-val">6</span><span class="acp-metric-label">Variant</span></div>
      <div class="acp-metric"><span class="acp-metric-val">4</span><span class="acp-metric-label">Semantic</span></div>
      <div class="acp-metric"><span class="acp-metric-val">3</span><span class="acp-metric-label">Missing</span></div>
    </div>
    <div class="acp-keywords"><div class="acp-kw-title">Keywords</div><div class="acp-kw-list">
      <span class="acp-kw-tag acp-kw-exact">Figma</span>
      <span class="acp-kw-tag acp-kw-exact">Design Systems</span>
      <span class="acp-kw-tag acp-kw-exact">Prototyping</span>
      <span class="acp-kw-tag acp-kw-exact">User Research</span>
      <span class="acp-kw-tag acp-kw-variant">UI/UX</span>
      <span class="acp-kw-tag acp-kw-variant">JavaScript</span>
      <span class="acp-kw-tag acp-kw-miss">Stripe API</span>
      <span class="acp-kw-tag acp-kw-miss">FinTech</span>
    </div></div>
  </div>
</div>`;

const ss6 = `<!DOCTYPE html><html><head><meta charset="UTF-8">
${CHROME_FRAME}
<style>.page-bg{width:100%;height:100%;}</style>
</head><body>
<div class="chrome-frame">
  <div class="chrome-titlebar">
    <div class="chrome-dots"><div class="chrome-dot red"></div><div class="chrome-dot yellow"></div><div class="chrome-dot green"></div></div>
    <div class="chrome-tabs"><div class="chrome-tab active"><div class="chrome-tab-icon" style="background:#0077b5">in</div><span>Senior Product Designer - Stripe | LinkedIn</span></div></div>
  </div>
  <div class="chrome-toolbar">
    <div class="chrome-nav-btn">&larr;</div><div class="chrome-nav-btn">&rarr;</div><div class="chrome-nav-btn">&#x21bb;</div>
    <div class="chrome-url-bar"><span class="chrome-url-lock">&#x1f512;</span><span class="chrome-url-text">linkedin.com/jobs/view/senior-product-designer-at-stripe</span></div>
    <div class="chrome-extensions"><div class="chrome-ext-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div></div>
  </div>
  <div class="chrome-content"><div class="page-bg">${ss6Content}</div></div>
</div>
</body></html>`;

// Screenshot 7: Autofill banner on Greenhouse
const ss7Content = `
<style>
  .greenhouse-page { font-family: system-ui, -apple-system, sans-serif; background: #fff; height: 100%; position: relative; }
  .acp-autofill-banner { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 1px solid #334155; font-family: system-ui; font-size: 13px; color: #e2e8f0; z-index: 100; }
  .acp-banner-text { display: flex; align-items: center; gap: 8px; }
  .acp-banner-btn { padding: 6px 14px; border-radius: 6px; font-family: system-ui; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
  .acp-banner-btn-fill { background: #2dd4bf; color: #0f172a; }
  .acp-banner-btn-skip { background: transparent; color: #94a3b8; border: 1px solid #475569; }
  .acp-banner-btn-never { background: transparent; color: #64748b; font-size: 11px; border: none; }
  .gh-header { padding: 20px 40px; padding-top: 56px; border-bottom: 1px solid #e5e7eb; }
  .gh-company { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .gh-company-logo { width: 48px; height: 48px; background: #6366f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 700; }
  .gh-company-name { font-size: 18px; font-weight: 700; color: #111; }
  .gh-job-title { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .gh-job-loc { color: #666; font-size: 14px; }
  .gh-form { max-width: 640px; margin: 0 auto; padding: 32px 40px; }
  .gh-form-section { margin-bottom: 24px; }
  .gh-form-title { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 16px; }
  .gh-field { margin-bottom: 16px; }
  .gh-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
  .gh-label .req { color: #e53e3e; }
  .gh-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; color: #111; background: #fff; }
  .gh-input.acp-filled { outline: 2px solid #2dd4bf; outline-offset: 1px; background: #f0fdf4; }
  .gh-row { display: flex; gap: 16px; }
  .gh-row > .gh-field { flex: 1; }
</style>
<div class="greenhouse-page">
  <div class="acp-autofill-banner">
    <div class="acp-banner-text">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>AICareerPivot can autofill this application</span>
    </div>
    <button class="acp-banner-btn acp-banner-btn-fill">Autofill</button>
    <button class="acp-banner-btn acp-banner-btn-skip">Skip</button>
    <button class="acp-banner-btn acp-banner-btn-never">Never on this site</button>
  </div>
  <div class="gh-header">
    <div class="gh-company"><div class="gh-company-logo">S</div><div class="gh-company-name">Stripe</div></div>
    <div class="gh-job-title">Senior Product Designer</div>
    <div class="gh-job-loc">San Francisco, CA</div>
  </div>
  <div class="gh-form">
    <div class="gh-form-section">
      <div class="gh-form-title">Your Information</div>
      <div class="gh-row">
        <div class="gh-field"><label class="gh-label">First Name <span class="req">*</span></label><input class="gh-input acp-filled" value="Jordan" readonly></div>
        <div class="gh-field"><label class="gh-label">Last Name <span class="req">*</span></label><input class="gh-input acp-filled" value="Rivera" readonly></div>
      </div>
      <div class="gh-field"><label class="gh-label">Email <span class="req">*</span></label><input class="gh-input acp-filled" value="jordan.rivera@email.com" readonly></div>
      <div class="gh-field"><label class="gh-label">Phone <span class="req">*</span></label><input class="gh-input acp-filled" value="+1 (555) 123-4567" readonly></div>
      <div class="gh-field"><label class="gh-label">LinkedIn Profile</label><input class="gh-input acp-filled" value="linkedin.com/in/jordanrivera" readonly></div>
    </div>
  </div>
</div>`;

const ss7 = `<!DOCTYPE html><html><head><meta charset="UTF-8">
${CHROME_FRAME}
<style>.page-bg{width:100%;height:100%;}</style>
</head><body>
<div class="chrome-frame">
  <div class="chrome-titlebar">
    <div class="chrome-dots"><div class="chrome-dot red"></div><div class="chrome-dot yellow"></div><div class="chrome-dot green"></div></div>
    <div class="chrome-tabs"><div class="chrome-tab active"><div class="chrome-tab-icon" style="background:#43a047">G</div><span>Stripe - Senior Product Designer | Greenhouse</span></div></div>
  </div>
  <div class="chrome-toolbar">
    <div class="chrome-nav-btn">&larr;</div><div class="chrome-nav-btn">&rarr;</div><div class="chrome-nav-btn">&#x21bb;</div>
    <div class="chrome-url-bar"><span class="chrome-url-lock">&#x1f512;</span><span class="chrome-url-text">boards.greenhouse.io/stripe/jobs/5432198/application</span></div>
    <div class="chrome-extensions"><div class="chrome-ext-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div></div>
  </div>
  <div class="chrome-content"><div class="page-bg">${ss7Content}</div></div>
</div>
</body></html>`;

const screenshots = [
  { name: 'screenshot-01-sign-in', html: ss1 },
  { name: 'screenshot-02-dashboard', html: ss2 },
  { name: 'screenshot-03-ats-score', html: ss3 },
  { name: 'screenshot-04-keywords', html: ss4 },
  { name: 'screenshot-05-saved', html: ss5 },
  { name: 'screenshot-06-injected-ui', html: ss6 },
  { name: 'screenshot-07-autofill', html: ss7 },
];

for (const s of screenshots) {
  const path = join(outDir, `${s.name}.html`);
  writeFileSync(path, s.html);
  console.log(`Written: ${path}`);
}

console.log('\nAll 7 screenshot mockups generated.');
console.log('Open each .html at 1280x800 and capture a screenshot.');
