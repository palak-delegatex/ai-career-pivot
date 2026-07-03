# AICareerPivot Multilingual Expansion Plan

**Author:** CEO | **Date:** 2026-07-03 | **Issue:** AIC-661 | **Status:** Active

## Executive Summary

AICareerPivot currently serves only English-speaking users. To hit our growth targets and capture the global wave of professionals pivoting into AI, we will add multilingual support for 6 high-impact languages. This unlocks ~3 billion additional potential users across markets with strong AI adoption demand and career transition activity.

## Target Languages (Priority Order)

| # | Language | Code | Markets | Why |
|---|----------|------|---------|-----|
| 1 | **Spanish** | `es` | Latin America, Spain | 580M+ speakers, massive AI curiosity in LATAM, low barrier to entry |
| 2 | **Hindi** | `hi` | India | 600M+ speakers, India's tech workforce actively upskilling for AI roles |
| 3 | **Portuguese** | `pt-BR` | Brazil | 260M+ speakers, Brazil is LATAM's largest tech market |
| 4 | **French** | `fr` | France, Francophone Africa | 300M+ speakers, growing AI adoption in France and West Africa |
| 5 | **German** | `de` | Germany, Austria, Switzerland | High purchasing power, strong engineering workforce in AI transition |
| 6 | **Japanese** | `ja` | Japan | High willingness to pay, strong AI adoption, accessible market (no firewall) |

**Why not Mandarin Chinese?** China's Great Firewall requires separate infrastructure, CDN, ICP licensing, and content compliance. The ROI at our stage is negative. We revisit after establishing the 6 markets above.

## Technical Architecture

### i18n Framework: `next-intl`

- Best-in-class Next.js App Router integration
- Route-based locale segments: `/es/dashboard`, `/hi/pricing`, `/fr/blog`
- Server component support, no client JS overhead for static translations
- ICU message format for plurals, dates, numbers

### Implementation Approach

1. **Locale routing**: `[locale]` dynamic segment wrapping all routes
2. **Translation files**: JSON per locale in `/messages/{locale}.json`
3. **AI-powered translation**: Use Claude API to generate initial translations from English source, then human review for key pages
4. **Locale detection**: Browser `Accept-Language` header + geo-IP for auto-redirect with user override
5. **SEO**: `hreflang` tags, locale-specific sitemaps, locale-specific metadata
6. **Content**: Blog posts get locale-specific versions; AI-generated content (reports, cover letters, resumes) output in user's selected language
7. **RTL**: Not needed for any of our 6 target languages

### AI Output Localization

Critical differentiator: our AI-generated outputs (career reports, cover letters, resumes, gap analysis) must generate in the user's language. This means:
- System prompts include locale parameter
- Resume/cover letter templates per locale with country-specific formatting conventions
- Job market data sources per country

### Phased Rollout

- **Phase 1 (Week 1-2):** i18n framework setup, English extraction, Spanish + Hindi
- **Phase 2 (Week 3-4):** Portuguese, French translations + locale-aware AI outputs
- **Phase 3 (Week 5-6):** German, Japanese + full QA across all locales

## Marketing & SEO Strategy

### Per-Language Content Plan

Each language gets:
- **Localized landing page** with country-specific value props and success stories
- **3-5 SEO blog posts** targeting "[language] AI career transition" keywords
- **Localized meta tags** and Open Graph for social sharing
- **Country-specific job market data** in marketing copy
- **Social media presence** on platforms dominant in each market

### SEO Specifics

| Language | Target Keywords (examples) | Platforms |
|----------|---------------------------|-----------|
| Spanish | "cambio de carrera con IA", "transicion laboral inteligencia artificial" | LinkedIn, Twitter/X, Instagram |
| Hindi | "AI career change India", "एआई करियर बदलाव" | LinkedIn, Twitter/X, YouTube |
| Portuguese | "mudanca de carreira com IA", "transicao profissional inteligencia artificial" | LinkedIn, Instagram, YouTube |
| French | "reconversion professionnelle IA", "changer de carriere intelligence artificielle" | LinkedIn, Twitter/X |
| German | "Karrierewechsel KI", "Berufswechsel kuenstliche Intelligenz" | LinkedIn, XING |
| Japanese | "AIキャリアチェンジ", "AI転職" | LinkedIn, Twitter/X, note.com |

### Growth Levers Per Market

- **India/Hindi:** Partner with Indian tech communities, target LinkedIn India heavily
- **LATAM/Spanish:** AI meetup communities, Spanish-language tech YouTube
- **Brazil/Portuguese:** Dev communities (TabNews, dev.to/pt), tech Twitter Brazil
- **France/French:** Station F ecosystem, French tech Twitter
- **Germany/German:** XING presence, German tech meetups, Handelsblatt audience
- **Japan/Japanese:** note.com content, Japanese Twitter tech community

## Design Considerations

- Language selector in navigation (globe icon + current language)
- RTL not needed but layout must handle longer German/French text gracefully
- Font stacks that support Devanagari (Hindi) and CJK (Japanese)
- Country flag icons are controversial -- use language names instead

## Success Metrics

- **Traffic:** 30% non-English organic traffic within 90 days of launch
- **Conversion:** Locale-specific conversion rate within 80% of English baseline
- **Coverage:** 100% of user-facing strings translated before each locale launches
- **AI Output Quality:** <5% user complaints about translation quality per locale

## Task Breakdown

### Technical (CTO)
1. Set up `next-intl` framework with `[locale]` routing
2. Extract all English strings to translation files
3. Implement locale detection + switcher component
4. Add `hreflang` and locale-specific sitemaps
5. Update AI prompts to support locale-aware output generation
6. Add Devanagari + CJK font support
7. Generate translations for Spanish, Hindi, Portuguese, French, German, Japanese
8. QA and fix layout issues across all locales

### Marketing & SEO (CMO)
1. Create localized landing pages for each language
2. Write 3-5 SEO blog posts per language targeting local keywords
3. Set up social media presence per market
4. Create locale-specific meta descriptions and OG tags
5. Build country-specific success stories / testimonials
6. Submit to local AI/tech directories per country

### Design (ChiefDesigner)
1. Design language selector component (nav integration)
2. Ensure design system handles text expansion (German ~30% longer)
3. Add Devanagari and Japanese font stacks to design tokens
4. Review and adjust layouts for multilingual content
