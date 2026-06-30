import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Replicate the scoring functions from linkedin-optimizer.js for testing
// (The content script is an IIFE so we duplicate the pure functions here)
// ---------------------------------------------------------------------------

function hasQuantifiedAchievements(text) {
  return /\d+%|\$[\d,]+|\d+[xX]|\d+\+|\d+ (?:million|billion|thousand|users|customers|clients|projects|teams|revenue|growth)/i.test(text);
}

function scoreHeadline(headline) {
  if (!headline) return { score: 0, tips: ["Add a headline — it's the first thing recruiters see"], status: "missing" };
  const tips = [];
  let score = 40;

  const words = headline.split(/\s+/).length;
  if (words >= 5) score += 15;
  else tips.push("Expand your headline — aim for 5+ descriptive words");

  if (words >= 8) score += 10;

  if (/\||•|·|—|,/.test(headline)) score += 10;
  else tips.push("Use separators (| or ·) to list multiple strengths");

  const hasKeywords = /engineer|developer|manager|lead|director|specialist|analyst|designer|consultant|scientist|architect/i.test(headline);
  if (hasKeywords) score += 15;
  else tips.push("Include your target job title so recruiters find you in search");

  if (headline.length > 120) score += 10;

  if (/helping|passionate|driven|results/i.test(headline)) score += 5;

  score = Math.min(100, score);
  return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
}

function scoreSummary(summary) {
  if (!summary) return { score: 0, tips: ["Add an About section — this is your personal pitch"], status: "missing" };
  const tips = [];
  let score = 30;

  if (summary.length >= 100) score += 10;
  if (summary.length >= 300) score += 10;
  else tips.push("Expand your About section — aim for 300+ characters for better recruiter engagement");

  if (summary.length >= 500) score += 5;

  if (hasQuantifiedAchievements(summary)) score += 15;
  else tips.push("Add metrics and numbers (e.g., 'led a team of 12', 'grew revenue 40%')");

  const paragraphs = summary.split(/\n\s*\n/).length;
  if (paragraphs >= 2) score += 10;
  else tips.push("Break your About into paragraphs — wall-of-text gets skipped");

  if (/\b(email|reach out|contact|connect|let's talk|open to)\b/i.test(summary)) score += 10;
  else tips.push("End with a call-to-action (e.g., 'Open to opportunities in...' or 'Reach out at...')");

  if (summary.split(/\s+/).length >= 50) score += 10;

  score = Math.min(100, score);
  return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
}

function scoreExperience(experience) {
  if (!experience || experience.length === 0) return { score: 0, tips: ["Add your work experience — this is the most important section for recruiters"], status: "missing" };
  const tips = [];
  let score = 30;

  if (experience.length >= 2) score += 10;
  if (experience.length >= 4) score += 5;

  const withDescriptions = experience.filter((e) => e.description && e.description.length > 30);
  const descRatio = withDescriptions.length / experience.length;
  if (descRatio >= 0.8) score += 15;
  else if (descRatio >= 0.5) score += 8;

  const thinEntries = experience.filter((e) => !e.description || e.description.length < 50);
  if (thinEntries.length > 0) {
    const names = thinEntries.slice(0, 2).map((e) => e.title || "an entry").join(", ");
    tips.push(`Add descriptions to: ${names} — thin entries hurt your score`);
  }

  const withMetrics = experience.filter((e) => hasQuantifiedAchievements(e.description || ""));
  if (withMetrics.length >= 2) score += 15;
  else if (withMetrics.length >= 1) score += 8;
  else tips.push("Add quantified achievements to your experience (numbers, percentages, dollar amounts)");

  const avgDescLen = withDescriptions.reduce((sum, e) => sum + e.description.length, 0) / (withDescriptions.length || 1);
  if (avgDescLen >= 150) score += 10;
  else if (avgDescLen >= 80) score += 5;

  if (/\b(led|managed|built|launched|designed|developed|increased|reduced|improved|created|implemented|drove|spearheaded|orchestrated)\b/i.test(experience.map((e) => e.description).join(" "))) {
    score += 10;
  } else {
    tips.push("Use strong action verbs: led, built, launched, increased, reduced, improved");
  }

  score = Math.min(100, score);
  return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
}

function scoreSkills(skills) {
  if (!skills || skills.length === 0) return { score: 0, tips: ["Add skills — recruiters filter candidates by skills"], status: "missing" };
  const tips = [];
  let score = 30;

  if (skills.length >= 5) score += 15;
  if (skills.length >= 10) score += 15;
  else tips.push(`Add more skills — you have ${skills.length}, aim for 10+`);

  if (skills.length >= 15) score += 10;
  if (skills.length >= 20) score += 10;

  if (skills.length >= 30) score += 10;

  if (skills.length < 5) tips.push("Listing at least 5 skills significantly boosts recruiter search visibility");

  score = Math.min(100, score);
  return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
}

function scoreEducation(education) {
  if (!education || education.length === 0) return { score: 0, tips: ["Add education or certifications — many recruiters filter by this"], status: "missing" };
  const tips = [];
  let score = 50;

  if (education.length >= 1) score += 20;
  if (education.length >= 2) score += 10;

  const withDegree = education.filter((e) => e.degreeField && e.degreeField.length > 3);
  if (withDegree.length > 0) score += 20;
  else tips.push("Add degree and field of study to your education entries");

  score = Math.min(100, score);
  return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
}

const SECTION_WEIGHTS = {
  headline: 0.20,
  summary: 0.25,
  experience: 0.25,
  skills: 0.15,
  education: 0.15,
};

function computeLocalScore(profileData) {
  const sections = {
    headline: scoreHeadline(profileData.headline),
    summary: scoreSummary(profileData.summary),
    experience: scoreExperience(profileData.experience),
    skills: scoreSkills(profileData.skills),
    education: scoreEducation(profileData.education),
  };

  let weightedSum = 0;
  for (const [key, data] of Object.entries(sections)) {
    weightedSum += data.score * SECTION_WEIGHTS[key];
  }
  const overallScore = Math.round(weightedSum);

  const missingSections = Object.entries(sections)
    .filter(([, data]) => data.status === "missing")
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

  return { overallScore, sections, missingSections };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("scoreHeadline", () => {
  it("returns 0 for empty headline", () => {
    const result = scoreHeadline("");
    expect(result.score).toBe(0);
    expect(result.status).toBe("missing");
  });

  it("returns 0 for null headline", () => {
    const result = scoreHeadline(null);
    expect(result.score).toBe(0);
    expect(result.status).toBe("missing");
  });

  it("scores a short headline low", () => {
    const result = scoreHeadline("Software");
    expect(result.score).toBeLessThan(70);
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it("scores a strong headline high", () => {
    const result = scoreHeadline("Senior Software Engineer | React, TypeScript, Node.js | Building scalable platforms at Stripe");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("rewards separators", () => {
    const without = scoreHeadline("Software Engineer at Company");
    const withSep = scoreHeadline("Software Engineer | Company");
    expect(withSep.score).toBeGreaterThanOrEqual(without.score);
  });

  it("rewards job title keywords", () => {
    const withKw = scoreHeadline("Software Engineer at a startup");
    const withoutKw = scoreHeadline("Professional at a startup");
    expect(withKw.score).toBeGreaterThan(withoutKw.score);
  });
});

describe("scoreSummary", () => {
  it("returns 0 for missing summary", () => {
    const result = scoreSummary("");
    expect(result.score).toBe(0);
    expect(result.status).toBe("missing");
  });

  it("scores a short summary low", () => {
    const result = scoreSummary("I work in tech.");
    expect(result.score).toBeLessThan(50);
  });

  it("scores a detailed summary high", () => {
    const summary = `Experienced software engineer with 8+ years building scalable platforms.

Led a team of 12 engineers at a Series B startup, driving 40% revenue growth through product improvements. Passionate about clean architecture and developer experience.

Open to opportunities in platform engineering and engineering management. Reach out to connect!`;
    const result = scoreSummary(summary);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("rewards quantified achievements", () => {
    const without = scoreSummary("I am a software engineer with experience building systems.");
    const withMetrics = scoreSummary("I am a software engineer who increased system performance by 40% and served 2 million users.");
    expect(withMetrics.score).toBeGreaterThan(without.score);
  });

  it("rewards call-to-action", () => {
    const without = scoreSummary("I am a software engineer with good experience in building things over the years and more stuff.");
    const withCta = scoreSummary("I am a software engineer with good experience in building things. Open to new opportunities and connecting.");
    expect(withCta.score).toBeGreaterThan(without.score);
  });
});

describe("scoreExperience", () => {
  it("returns 0 for no experience", () => {
    expect(scoreExperience([]).score).toBe(0);
    expect(scoreExperience([]).status).toBe("missing");
    expect(scoreExperience(null).score).toBe(0);
  });

  it("penalizes thin entries", () => {
    const exp = [
      { title: "Engineer", company: "Co", description: "" },
      { title: "Developer", company: "Co", description: "Short" },
    ];
    const result = scoreExperience(exp);
    expect(result.tips.some((t) => t.includes("descriptions"))).toBe(true);
  });

  it("rewards detailed experience with metrics", () => {
    const exp = [
      { title: "Senior Engineer", company: "BigCo", description: "Led a team of 8 engineers to build a microservices platform serving 5 million daily active users. Reduced deployment time by 60% through CI/CD improvements." },
      { title: "Engineer", company: "StartupCo", description: "Built the core payment processing system handling $2M in monthly transactions. Implemented automated testing that increased code coverage from 40% to 90%." },
    ];
    const result = scoreExperience(exp);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("rewards action verbs", () => {
    const withVerbs = [
      { title: "Engineer", company: "Co", description: "Led development of the platform. Built infrastructure. Launched new features for 1000+ users." },
    ];
    const withoutVerbs = [
      { title: "Engineer", company: "Co", description: "Worked on the platform with the team. Was responsible for several things. Did stuff with code." },
    ];
    expect(scoreExperience(withVerbs).score).toBeGreaterThan(scoreExperience(withoutVerbs).score);
  });
});

describe("scoreSkills", () => {
  it("returns 0 for empty skills", () => {
    expect(scoreSkills([]).score).toBe(0);
    expect(scoreSkills([]).status).toBe("missing");
  });

  it("scales with skill count", () => {
    const few = scoreSkills(["React", "JS"]);
    const medium = scoreSkills(Array.from({ length: 10 }, (_, i) => `Skill${i}`));
    const many = scoreSkills(Array.from({ length: 20 }, (_, i) => `Skill${i}`));
    expect(medium.score).toBeGreaterThan(few.score);
    expect(many.score).toBeGreaterThan(medium.score);
  });

  it("suggests adding skills when count is low", () => {
    const result = scoreSkills(["React", "TypeScript", "Node.js"]);
    expect(result.tips.some((t) => t.includes("aim for 10+"))).toBe(true);
  });
});

describe("scoreEducation", () => {
  it("returns 0 for no education", () => {
    expect(scoreEducation([]).score).toBe(0);
    expect(scoreEducation([]).status).toBe("missing");
  });

  it("scores present education", () => {
    const result = scoreEducation([{ institution: "MIT", degreeField: "BS Computer Science" }]);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("suggests adding degree info when missing", () => {
    const result = scoreEducation([{ institution: "MIT", degreeField: "" }]);
    expect(result.tips.some((t) => t.includes("degree"))).toBe(true);
  });
});

describe("computeLocalScore", () => {
  it("scores an empty profile at 0", () => {
    const result = computeLocalScore({
      headline: "",
      summary: "",
      experience: [],
      skills: [],
      education: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.missingSections).toHaveLength(5);
  });

  it("scores a complete profile higher than a partial one", () => {
    const partial = computeLocalScore({
      headline: "Engineer",
      summary: "",
      experience: [{ title: "Dev", company: "Co", description: "" }],
      skills: ["JS"],
      education: [],
    });
    const full = computeLocalScore({
      headline: "Senior Software Engineer | React, Node.js, AWS | Building scalable cloud platforms",
      summary: "8+ years building production systems at scale. Led teams of 10+ engineers.\n\nSpecializing in cloud architecture and distributed systems. Open to senior engineering roles.",
      experience: [
        { title: "Senior Engineer", company: "BigCo", description: "Led a team of 12 building microservices platform. Improved uptime from 99.5% to 99.99%. Managed $500K infrastructure budget." },
        { title: "Engineer", company: "StartupCo", description: "Built core API serving 2 million daily requests. Reduced latency by 40% through caching strategy. Launched 3 major features." },
      ],
      skills: Array.from({ length: 15 }, (_, i) => `Skill${i}`),
      education: [{ institution: "Stanford", degreeField: "MS Computer Science" }],
    });

    expect(full.overallScore).toBeGreaterThan(partial.overallScore);
    expect(full.overallScore).toBeGreaterThanOrEqual(70);
    expect(full.missingSections).toHaveLength(0);
  });

  it("weights sections correctly", () => {
    const result = computeLocalScore({
      headline: "Senior Software Engineer | React, Node.js | Building great products with passion and drive",
      summary: "",
      experience: [],
      skills: [],
      education: [],
    });
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(30);
    expect(result.missingSections).toContain("Summary");
    expect(result.missingSections).toContain("Experience");
  });
});

describe("hasQuantifiedAchievements", () => {
  it("detects percentages", () => {
    expect(hasQuantifiedAchievements("Increased revenue by 40%")).toBe(true);
  });

  it("detects dollar amounts", () => {
    expect(hasQuantifiedAchievements("Managed $500K budget")).toBe(true);
  });

  it("detects user counts", () => {
    expect(hasQuantifiedAchievements("Served 2 million users")).toBe(true);
  });

  it("detects multipliers", () => {
    expect(hasQuantifiedAchievements("Improved speed 3x")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(hasQuantifiedAchievements("Worked on various projects")).toBe(false);
  });
});
