// Shared types for the Warm-Intro reveal section (AIC-772).
// Mirrors the GET /api/warm-intro response shape (see src/app/api/warm-intro/route.ts).

export interface WarmIntroContact {
  id: string;
  name: string;
  role: string | null;
  linkedin_url: string | null;
  strength_tier: string;
  confidence_score: number;
  connection_degree: number;
  // Null in the CRM-only MVP (no people-graph). Populated later when a verified
  // mutual is known → renders the "You → {mutual} → {contact}" path.
  mutual_name: string | null;
  mutual_role: string | null;
}

export interface WarmIntroTeaser {
  has_connection: true;
  role_title: string | null;
  connection_degree: number;
  confidence_score: number;
  top_tier: string;
}

export interface WarmIntroApiResponse {
  company: string;
  connectionCount: number;
  topTier: string | null;
  paid: boolean;
  teaser: WarmIntroTeaser | null;
  contacts: WarmIntroContact[];
}
