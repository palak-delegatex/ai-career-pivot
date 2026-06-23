export const FROM = "AICareerPivot Team <team@ai-career-pivot.com>";
export const REPLY_TO = "founders@ai-career-pivot.com";
export const SITE = "https://ai-career-pivot.com";
export const FOUNDER = "The AICareerPivot Team";

const footerText: Record<string, string> = {
  en: "You're receiving this because you joined the AICareerPivot waitlist.",
  hi: "आपको यह ईमेल इसलिए मिल रहा है क्योंकि आपने AICareerPivot वेटलिस्ट में शामिल हुए।",
  es: "Recibes esto porque te uniste a la lista de espera de AICareerPivot.",
};

const unsubText: Record<string, string> = {
  en: "Unsubscribe",
  hi: "सदस्यता रद्द करें",
  es: "Cancelar suscripción",
};

export function utmLink(path: string, campaign: string, locale: string = "en") {
  const prefix = locale !== "en" ? `/${locale}` : "";
  return `${SITE}${prefix}${path}?utm_source=email&utm_medium=nurture&utm_campaign=${campaign}`;
}

export function baseHtml(content: string, locale: string = "en") {
  const footer = footerText[locale] ?? footerText.en;
  const unsub = unsubText[locale] ?? unsubText.en;
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:32px;">
      <span style="color:#2dd4bf;font-weight:700;font-size:18px;">AICareerPivot</span>
    </div>
    ${content}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #1e293b;">
      <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
        ${footer}<br>
        <a href="${utmLink("/", "unsubscribe", locale)}" style="color:#475569;">${unsub}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function p(text: string) {
  return `<p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 16px 0;">${text}</p>`;
}

export function h1(text: string) {
  return `<h1 style="color:#f1f5f9;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 24px 0;">${text}</h1>`;
}

export function cta(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#0d9488;color:#f9fafb;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">${text}</a>`;
}

export function sig() {
  return `<p style="color:#64748b;font-size:15px;line-height:1.6;margin:24px 0 0 0;">${FOUNDER}</p>`;
}
