import { describe, it, expect } from "vitest";

const JD_STOP_WORDS = new Set([
  "the","and","for","are","but","not","you","all","can","had","her","was","one",
  "our","out","day","get","has","him","his","how","its","may","new","now","old",
  "see","way","who","did","let","say","she","too","use","with","have","from",
  "this","that","they","will","been","each","make","like","long","look","many",
  "some","than","them","then","what","when","more","also","back","much","most",
  "only","over","such","take","than","your","about","after","being","could",
  "every","first","into","just","must","other","still","their","there","these",
  "those","under","where","which","while","would","should","through","between",
  "before","during","without","within","across","work","working","team","role",
  "join","help","part","well","good","best","able","need","year","years","plus",
  "including","using","strong","experience","ability","skills","knowledge",
  "preferred","required","requirements","qualifications","responsibilities",
  "description","position","candidate","company","looking","ideal","must",
  "minimum","etc","e.g","i.e","per","via","based","related","relevant",
  "proven","track","record","communicate","effectively","environment","fast",
  "paced","bonus","salary","benefits","equal","opportunity","employer",
]);

function extractJdGaps(jdText, matchedSkills) {
  const jdLower = jdText.toLowerCase();
  const matchedLower = new Set(matchedSkills.map((s) => s.toLowerCase()));

  const words = jdLower.split(/[\s,;.()\/\[\]{}|]+/).filter((w) => w.length > 1);
  const freq = {};
  for (const w of words) {
    if (!JD_STOP_WORDS.has(w) && w.length > 2 && !/^\d+$/.test(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    const bi = words[i] + " " + words[i + 1];
    if (!JD_STOP_WORDS.has(words[i]) && !JD_STOP_WORDS.has(words[i + 1])) {
      bigrams.push(bi);
    }
  }
  for (const bi of bigrams) {
    freq[bi] = (freq[bi] || 0) + 1;
  }

  const gaps = [];
  const seen = new Set();

  const sorted = Object.entries(freq)
    .filter(([term, count]) => count >= 1 && term.length > 2)
    .sort((a, b) => b[1] - a[1]);

  for (const [term, count] of sorted) {
    if (seen.has(term)) continue;
    if (matchedLower.has(term)) continue;

    let covered = false;
    for (const ms of matchedLower) {
      if (ms.includes(term) || term.includes(ms)) { covered = true; break; }
    }
    if (covered) continue;

    for (const g of gaps) {
      if (g.keyword.includes(term) || term.includes(g.keyword)) { covered = true; break; }
    }
    if (covered) continue;

    let importance;
    if (count >= 3) importance = "critical";
    else if (count >= 2) importance = "important";
    else importance = "helpful";

    seen.add(term);
    gaps.push({ keyword: term, importance, count });
    if (gaps.length >= 12) break;
  }

  return gaps;
}

function quickScore(jobDescription, userProfile) {
  if (!userProfile?.skills?.length)
    return { score: 0, matched: [], missing: [], total: 0 };

  const jdLower = jobDescription.toLowerCase();
  const jdWords = new Set(
    jdLower.split(/[\s,;.()\/]+/).filter((w) => w.length > 2)
  );

  const matched = [];
  const missing = [];

  for (const skill of userProfile.skills) {
    const skillLower = skill.toLowerCase();
    const skillWords = skillLower.split(/\s+/);

    if (jdLower.includes(skillLower)) {
      matched.push({ skill, matchType: "exact" });
    } else if (
      (userProfile.variants?.[skill] || []).some((v) =>
        jdLower.includes(v.toLowerCase())
      )
    ) {
      matched.push({ skill, matchType: "variant" });
    } else if (
      skillWords.length > 1 &&
      skillWords.every((w) => jdWords.has(w))
    ) {
      matched.push({ skill, matchType: "semantic" });
    } else {
      missing.push(skill);
    }
  }

  const matchedSkillNames = matched.map((m) => m.skill);
  const gaps = extractJdGaps(jobDescription, matchedSkillNames);

  const total = userProfile.skills.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;
  return { score, matched, missing, gaps, total };
}

describe("quickScore", () => {
  const JD = `
    We are looking for a Senior Software Engineer with experience in
    React, TypeScript, and Node.js. Experience with PostgreSQL and AWS
    is a plus. You should have strong skills in React and TypeScript.
    Knowledge of CI/CD pipelines and Docker is preferred.
    Must have experience building REST APIs with Node.js.
  `;

  it("scores exact matches", () => {
    const profile = { skills: ["React", "TypeScript", "Node.js"] };
    const result = quickScore(JD, profile);
    expect(result.score).toBe(100);
    expect(result.matched).toHaveLength(3);
    expect(result.matched.every((m) => m.matchType === "exact")).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("detects variant matches", () => {
    const profile = {
      skills: ["React.js"],
      variants: { "React.js": ["React", "ReactJS"] },
    };
    const result = quickScore(JD, profile);
    expect(result.score).toBe(100);
    expect(result.matched[0].matchType).toBe("variant");
  });

  it("detects semantic matches (multi-word skills)", () => {
    const profile = { skills: ["scalable systems"] };
    const result = quickScore("We need engineers who build scalable distributed systems", profile);
    expect(result.score).toBe(100);
    expect(result.matched[0].matchType).toBe("semantic");
  });

  it("reports missing skills", () => {
    const profile = { skills: ["React", "Kubernetes", "GraphQL"] };
    const result = quickScore(JD, profile);
    expect(result.score).toBe(33);
    expect(result.matched).toHaveLength(1);
    expect(result.missing).toContain("Kubernetes");
    expect(result.missing).toContain("GraphQL");
  });

  it("returns zero for empty profile", () => {
    expect(quickScore(JD, null).score).toBe(0);
    expect(quickScore(JD, { skills: [] }).score).toBe(0);
    expect(quickScore(JD, {}).score).toBe(0);
  });

  it("calculates correct percentage", () => {
    const profile = { skills: ["React", "TypeScript", "Java", "Go"] };
    const result = quickScore(JD, profile);
    expect(result.score).toBe(50);
    expect(result.matched).toHaveLength(2);
    expect(result.missing).toHaveLength(2);
    expect(result.total).toBe(4);
  });

  it("is case-insensitive", () => {
    const profile = { skills: ["react", "TYPESCRIPT", "node.js"] };
    const result = quickScore(JD, profile);
    expect(result.score).toBe(100);
  });
});

describe("extractJdGaps", () => {
  const JD = `
    Experience with React and TypeScript required.
    Must know Docker, Docker Compose, and Kubernetes.
    Docker experience is critical. CI/CD pipeline knowledge needed.
  `;

  it("finds frequent unmatched terms", () => {
    const gaps = extractJdGaps(JD, ["React", "TypeScript"]);
    const keywords = gaps.map((g) => g.keyword);
    expect(keywords.some((k) => k.includes("docker"))).toBe(true);
  });

  it("assigns critical importance to 3+ count terms", () => {
    const gaps = extractJdGaps(JD, []);
    const docker = gaps.find((g) => g.keyword === "docker");
    if (docker) {
      expect(docker.importance).toBe("critical");
    }
  });

  it("skips already-matched skills", () => {
    const gaps = extractJdGaps(JD, ["Docker"]);
    const keywords = gaps.map((g) => g.keyword);
    expect(keywords.includes("docker")).toBe(false);
  });

  it("caps at 12 gaps", () => {
    const longJd = Array.from({ length: 50 }, (_, i) => `skill${i}`).join(" ");
    const gaps = extractJdGaps(longJd, []);
    expect(gaps.length).toBeLessThanOrEqual(12);
  });

  it("returns empty for empty JD", () => {
    expect(extractJdGaps("", [])).toHaveLength(0);
  });
});

describe("Match Type Classification", () => {
  it("prioritizes exact over variant", () => {
    const profile = {
      skills: ["React"],
      variants: { React: ["ReactJS"] },
    };
    const result = quickScore("We use React daily", profile);
    expect(result.matched[0].matchType).toBe("exact");
  });

  it("handles multi-word exact matches", () => {
    const profile = { skills: ["machine learning"] };
    const result = quickScore("Experience in machine learning required", profile);
    expect(result.matched[0].matchType).toBe("exact");
  });
});
