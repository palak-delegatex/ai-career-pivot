import fs from "fs";
import path from "path";

/**
 * Programmatic career-pivot pages (AIC-710).
 *
 * The dataset in `src/content/pivots/pivots.json` is authored and owned by the
 * CMO (AIC-697). Each entry drives one `/pivot/<slug>` page. Copy is English
 * only for now, so these pages render for the default locale; see
 * `generateStaticParams` in the route.
 */

export interface PivotBodyBlock {
  heading: string;
  body: string;
}

export interface PivotFaqItem {
  question: string;
  answer: string;
}

export interface Pivot {
  /** URL slug, e.g. "teacher-to-ai-learning-experience-designer". */
  slug: string;
  fromRole: string;
  toRole: string;
  headline: string;
  subhead: string;
  transferableSkills: string[];
  bodyBlocks: PivotBodyBlock[];
  faq: PivotFaqItem[];
  cta: string;
}

interface PivotDataset {
  version: number;
  note?: string;
  pivots: Pivot[];
}

const DATA_PATH = path.join(
  process.cwd(),
  "src/content/pivots/pivots.json",
);

// Read + parse once per server process. The dataset is static content shipped
// with the build, so there is no need to re-read it on every request.
let cache: Pivot[] | null = null;

function load(): Pivot[] {
  if (cache) return cache;
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw) as PivotDataset;
  cache = Array.isArray(data.pivots) ? data.pivots : [];
  return cache;
}

/** Every pivot, in dataset order (curated by the CMO). */
export function getAllPivots(): Pivot[] {
  return load();
}

/** Slugs for `generateStaticParams`. */
export function getAllPivotSlugs(): string[] {
  return load().map((p) => p.slug);
}

/** A single pivot by slug, or `null` when the slug is unknown. */
export function getPivot(slug: string): Pivot | null {
  return load().find((p) => p.slug === slug) ?? null;
}
