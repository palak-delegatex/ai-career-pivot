import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconSvg = readFileSync(join(__dirname, '..', 'icons', 'icon-master.svg'));

// ── Brand tokens ──
const bg = '#0f172a';
const bgCard = '#1e293b';
const teal400 = '#2dd4bf';
const teal300 = '#5eead4';
const teal200 = '#99f6e4';
const teal600 = '#0d9488';
const slate400 = '#94a3b8';
const slate200 = '#e2e8f0';
const white = '#f1f5f9';

// ── Small tile: 440x280 ──
async function generateSmallTile() {
  const w = 440, h = 280;
  const iconSize = 56;
  const iconBuf = await sharp(iconSvg, { density: 300 }).resize(iconSize, iconSize).png().toBuffer();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bgG" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="${bg}"/>
      </linearGradient>
      <linearGradient id="accentG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${teal300}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${teal600}" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="textG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${teal200}"/>
        <stop offset="100%" stop-color="${teal400}"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${w}" height="${h}" fill="url(#bgG)"/>

    <!-- Subtle accent blob -->
    <circle cx="360" cy="60" r="160" fill="url(#accentG)"/>
    <circle cx="80" cy="240" r="120" fill="url(#accentG)" opacity="0.5"/>

    <!-- Content -->
    <text x="220" y="90" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="url(#textG)">AICareerPivot</text>
    <text x="220" y="124" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${slate400}">Job Saver &amp; ATS Score</text>

    <!-- Divider -->
    <line x1="140" y1="144" x2="300" y2="144" stroke="${teal600}" stroke-width="1" opacity="0.4"/>

    <!-- Feature bullets -->
    <text x="220" y="175" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${slate200}">Save jobs from LinkedIn, Indeed &amp; more</text>
    <text x="220" y="198" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${slate200}">Instant ATS match scores</text>
    <text x="220" y="221" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="${slate200}">One-click application autofill</text>

    <!-- Bottom accent bar -->
    <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${teal400}" opacity="0.7"/>
  </svg>`;

  const base = sharp(Buffer.from(svg)).png();
  const result = await base.composite([
    { input: iconBuf, top: 28, left: Math.round((w - iconSize) / 2) - 80 }
  ]).toBuffer();

  // Re-layer: put icon inline with title
  await sharp(Buffer.from(svg)).png()
    .toFile(join(__dirname, 'promo-small-440x280.png'));
  console.log('Generated promo-small-440x280.png');
}

// ── Large tile: 920x680 ──
async function generateLargeTile() {
  const w = 920, h = 680;

  // Create a mini popup mockup as an inset SVG
  const popupMockup = `
    <!-- Popup frame -->
    <rect x="560" y="80" width="300" height="520" rx="16" ry="16" fill="${bgCard}" stroke="${teal600}" stroke-width="1" opacity="0.9"/>
    <!-- Popup header -->
    <rect x="560" y="80" width="300" height="48" rx="16" ry="16" fill="${bgCard}"/>
    <rect x="560" y="112" width="300" height="16" fill="${bgCard}"/>
    <circle cx="584" cy="104" r="10" fill="${teal400}" opacity="0.3"/>
    <text x="600" y="108" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="${white}">AICareerPivot</text>

    <!-- Pipeline row -->
    <rect x="576" y="140" width="268" height="48" rx="8" fill="${bg}"/>
    <circle cx="608" cy="164" r="5" fill="${slate400}"/>
    <text x="608" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="${slate400}">Saved</text>
    <text x="650" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#475569">→</text>
    <circle cx="690" cy="164" r="5" fill="${teal400}"/>
    <text x="690" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="${slate400}">Applied</text>
    <text x="730" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#475569">→</text>
    <circle cx="770" cy="164" r="5" fill="#fbbf24"/>
    <text x="770" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="${slate400}">Interview</text>
    <text x="810" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#475569">→</text>
    <circle cx="820" cy="164" r="5" fill="#10b981"/>

    <!-- Score ring mockup -->
    <circle cx="710" cy="290" r="44" fill="none" stroke="${bg}" stroke-width="6"/>
    <circle cx="710" cy="290" r="44" fill="none" stroke="${teal400}" stroke-width="6" stroke-dasharray="220 56" stroke-linecap="round" transform="rotate(-90 710 290)"/>
    <text x="710" y="296" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="${white}">82</text>
    <text x="710" y="312" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="${slate400}">ATS Score</text>

    <!-- Metric bars -->
    <rect x="576" y="360" width="82" height="48" rx="6" fill="${bg}"/>
    <text x="617" y="382" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">6/8</text>
    <text x="617" y="398" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" fill="${slate400}">Skills</text>

    <rect x="668" y="360" width="82" height="48" rx="6" fill="${bg}"/>
    <text x="709" y="382" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">3/4</text>
    <text x="709" y="398" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" fill="${slate400}">Keywords</text>

    <rect x="760" y="360" width="82" height="48" rx="6" fill="${bg}"/>
    <text x="801" y="382" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">92%</text>
    <text x="801" y="398" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" fill="${slate400}">Format</text>

    <!-- Save button -->
    <rect x="576" y="430" width="268" height="36" rx="8" fill="${teal400}"/>
    <text x="710" y="453" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="${bg}">Save Job &amp; Score</text>

    <!-- Keyword tags -->
    <rect x="576" y="484" width="268" height="80" rx="8" fill="${bg}"/>
    <text x="590" y="504" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="${slate400}">Keyword Match</text>
    <rect x="590" y="514" width="54" height="18" rx="9" fill="#064e3b"/>
    <text x="617" y="527" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#6ee7b7">React</text>
    <rect x="650" y="514" width="68" height="18" rx="9" fill="#064e3b"/>
    <text x="684" y="527" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#6ee7b7">TypeScript</text>
    <rect x="724" y="514" width="44" height="18" rx="9" fill="#064e3b"/>
    <text x="746" y="527" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#6ee7b7">Node</text>
    <rect x="774" y="514" width="50" height="18" rx="9" fill="#064e3b"/>
    <text x="799" y="527" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#6ee7b7">AWS</text>
    <rect x="590" y="538" width="52" height="18" rx="9" fill="#451a03"/>
    <text x="616" y="551" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fbbf24">GraphQL</text>
    <rect x="648" y="538" width="44" height="18" rx="9" fill="#451a03"/>
    <text x="670" y="551" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#fbbf24">K8s</text>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bgG2" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="${bg}"/>
      </linearGradient>
      <linearGradient id="accentG2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${teal300}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${teal600}" stop-opacity="0.03"/>
      </linearGradient>
      <linearGradient id="titleG2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${teal200}"/>
        <stop offset="100%" stop-color="${teal400}"/>
      </linearGradient>
    </defs>

    <rect width="${w}" height="${h}" fill="url(#bgG2)"/>

    <!-- Decorative blobs -->
    <circle cx="140" cy="120" r="260" fill="url(#accentG2)"/>
    <circle cx="800" cy="580" r="200" fill="url(#accentG2)" opacity="0.4"/>

    <!-- Left content -->
    <text x="60" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="url(#titleG2)">AICareerPivot</text>
    <text x="60" y="185" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="${slate200}">Job Saver &amp; ATS Score</text>

    <line x1="60" y1="210" x2="200" y2="210" stroke="${teal600}" stroke-width="2" opacity="0.5"/>

    <!-- Value props with check marks -->
    <text x="84" y="260" font-family="system-ui, sans-serif" font-size="16" fill="${teal400}">&#x2713;</text>
    <text x="106" y="260" font-family="system-ui, sans-serif" font-size="16" fill="${slate200}">Save jobs from any board</text>

    <text x="84" y="296" font-family="system-ui, sans-serif" font-size="16" fill="${teal400}">&#x2713;</text>
    <text x="106" y="296" font-family="system-ui, sans-serif" font-size="16" fill="${slate200}">Instant ATS match scores</text>

    <text x="84" y="332" font-family="system-ui, sans-serif" font-size="16" fill="${teal400}">&#x2713;</text>
    <text x="106" y="332" font-family="system-ui, sans-serif" font-size="16" fill="${slate200}">Resume keyword analysis</text>

    <text x="84" y="368" font-family="system-ui, sans-serif" font-size="16" fill="${teal400}">&#x2713;</text>
    <text x="106" y="368" font-family="system-ui, sans-serif" font-size="16" fill="${slate200}">One-click autofill</text>

    <text x="84" y="404" font-family="system-ui, sans-serif" font-size="16" fill="${teal400}">&#x2713;</text>
    <text x="106" y="404" font-family="system-ui, sans-serif" font-size="16" fill="${slate200}">Track your pipeline</text>

    <!-- Supported sites -->
    <text x="60" y="470" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${slate400}" text-transform="uppercase" letter-spacing="1">WORKS WITH</text>

    <rect x="60" y="486" width="80" height="28" rx="6" fill="${bgCard}"/>
    <text x="100" y="505" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">LinkedIn</text>

    <rect x="148" y="486" width="64" height="28" rx="6" fill="${bgCard}"/>
    <text x="180" y="505" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Indeed</text>

    <rect x="220" y="486" width="84" height="28" rx="6" fill="${bgCard}"/>
    <text x="262" y="505" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Glassdoor</text>

    <rect x="312" y="486" width="96" height="28" rx="6" fill="${bgCard}"/>
    <text x="360" y="505" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">ZipRecruiter</text>

    <rect x="60" y="522" width="92" height="28" rx="6" fill="${bgCard}"/>
    <text x="106" y="541" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Greenhouse</text>

    <rect x="160" y="522" width="56" height="28" rx="6" fill="${bgCard}"/>
    <text x="188" y="541" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Lever</text>

    <rect x="224" y="522" width="76" height="28" rx="6" fill="${bgCard}"/>
    <text x="262" y="541" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Workday</text>

    <rect x="308" y="522" width="64" height="28" rx="6" fill="${bgCard}"/>
    <text x="340" y="541" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${slate200}">Ashby</text>

    <!-- CTA -->
    <rect x="60" y="590" width="200" height="44" rx="10" fill="${teal400}"/>
    <text x="160" y="618" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${bg}">Add to Chrome — Free</text>

    <!-- Right side: popup mockup -->
    ${popupMockup}

    <!-- Bottom accent -->
    <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${teal400}" opacity="0.6"/>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(__dirname, 'promo-large-920x680.png'));
  console.log('Generated promo-large-920x680.png');
}

// ── Marquee: 1400x560 ──
async function generateMarquee() {
  const w = 1400, h = 560;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bgG3" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="${bg}"/>
      </linearGradient>
      <linearGradient id="accentG3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${teal300}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${teal600}" stop-opacity="0.02"/>
      </linearGradient>
      <linearGradient id="titleG3" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${teal200}"/>
        <stop offset="50%" stop-color="${teal400}"/>
        <stop offset="100%" stop-color="${teal600}"/>
      </linearGradient>
    </defs>

    <rect width="${w}" height="${h}" fill="url(#bgG3)"/>

    <!-- Decorative -->
    <circle cx="300" cy="100" r="360" fill="url(#accentG3)"/>
    <circle cx="1100" cy="460" r="280" fill="url(#accentG3)" opacity="0.5"/>
    <circle cx="700" cy="300" r="200" fill="url(#accentG3)" opacity="0.3"/>

    <!-- Left content -->
    <text x="100" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="800" fill="url(#titleG3)">AICareerPivot</text>
    <text x="100" y="215" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="${slate200}">Your AI-Powered Job Search Companion</text>

    <line x1="100" y1="240" x2="340" y2="240" stroke="${teal600}" stroke-width="2" opacity="0.5"/>

    <!-- 3-column feature grid -->
    <!-- Col 1 -->
    <rect x="100" y="270" width="240" height="100" rx="12" fill="${bgCard}" opacity="0.7"/>
    <text x="120" y="305" font-family="system-ui, sans-serif" font-size="20" fill="${teal400}">&#x1F4BE;</text>
    <text x="148" y="305" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">Save From Anywhere</text>
    <text x="120" y="330" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">LinkedIn, Indeed, Glassdoor,</text>
    <text x="120" y="348" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">ZipRecruiter, Greenhouse &amp; more</text>

    <!-- Col 2 -->
    <rect x="360" y="270" width="240" height="100" rx="12" fill="${bgCard}" opacity="0.7"/>
    <text x="380" y="305" font-family="system-ui, sans-serif" font-size="20" fill="${teal400}">&#x1F3AF;</text>
    <text x="408" y="305" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">ATS Match Score</text>
    <text x="380" y="330" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">Instant resume-to-job scoring</text>
    <text x="380" y="348" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">with keyword gap analysis</text>

    <!-- Col 3 -->
    <rect x="620" y="270" width="240" height="100" rx="12" fill="${bgCard}" opacity="0.7"/>
    <text x="640" y="305" font-family="system-ui, sans-serif" font-size="20" fill="${teal400}">&#x26A1;</text>
    <text x="668" y="305" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${white}">One-Click Autofill</text>
    <text x="640" y="330" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">Auto-complete applications on</text>
    <text x="640" y="348" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">Greenhouse, Lever &amp; Workday</text>

    <!-- CTA -->
    <rect x="100" y="420" width="260" height="52" rx="12" fill="${teal400}"/>
    <text x="230" y="453" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${bg}">Add to Chrome — Free</text>

    <text x="100" y="508" font-family="system-ui, sans-serif" font-size="13" fill="${slate400}">Works with 8+ job boards. No data sold. Ever.</text>

    <!-- Right side: score ring hero -->
    <rect x="960" y="60" width="340" height="440" rx="20" fill="${bgCard}" opacity="0.5" stroke="${teal600}" stroke-width="1" stroke-opacity="0.3"/>

    <!-- Mini header in card -->
    <circle cx="994" cy="100" r="12" fill="${teal400}" opacity="0.25"/>
    <text x="1014" y="105" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${white}">AICareerPivot</text>

    <!-- Score ring -->
    <circle cx="1130" cy="230" r="68" fill="none" stroke="${bg}" stroke-width="8"/>
    <circle cx="1130" cy="230" r="68" fill="none" stroke="${teal400}" stroke-width="8" stroke-dasharray="340 88" stroke-linecap="round" transform="rotate(-90 1130 230)"/>
    <text x="1130" y="238" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="800" fill="${white}">82</text>
    <text x="1130" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${slate400}">ATS Match Score</text>

    <!-- Metric pills -->
    <rect x="990" y="330" width="100" height="52" rx="8" fill="${bg}"/>
    <text x="1040" y="354" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${white}">6/8</text>
    <text x="1040" y="372" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="${slate400}">Skills</text>

    <rect x="1100" y="330" width="100" height="52" rx="8" fill="${bg}"/>
    <text x="1150" y="354" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${white}">3/4</text>
    <text x="1150" y="372" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="${slate400}">Keywords</text>

    <rect x="1210" y="330" width="60" height="52" rx="8" fill="${bg}"/>
    <text x="1240" y="354" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${white}">92%</text>
    <text x="1240" y="372" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="${slate400}">Format</text>

    <!-- Tags -->
    <rect x="990" y="400" width="56" height="22" rx="11" fill="#064e3b"/>
    <text x="1018" y="415" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6ee7b7">React</text>
    <rect x="1054" y="400" width="78" height="22" rx="11" fill="#064e3b"/>
    <text x="1093" y="415" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6ee7b7">TypeScript</text>
    <rect x="1140" y="400" width="50" height="22" rx="11" fill="#064e3b"/>
    <text x="1165" y="415" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6ee7b7">Node</text>
    <rect x="1198" y="400" width="48" height="22" rx="11" fill="#064e3b"/>
    <text x="1222" y="415" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6ee7b7">AWS</text>

    <rect x="990" y="430" width="62" height="22" rx="11" fill="#451a03"/>
    <text x="1021" y="445" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#fbbf24">GraphQL</text>
    <rect x="1060" y="430" width="42" height="22" rx="11" fill="#451a03"/>
    <text x="1081" y="445" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#fbbf24">K8s</text>

    <!-- Bottom accent -->
    <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${teal400}" opacity="0.5"/>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(__dirname, 'promo-marquee-1400x560.png'));
  console.log('Generated promo-marquee-1400x560.png');
}

await generateSmallTile();
await generateLargeTile();
await generateMarquee();
console.log('All promo images generated!');
