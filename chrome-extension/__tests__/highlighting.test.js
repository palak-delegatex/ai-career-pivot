// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightKeywordsInElement(descEl, matchedTerms, missingTerms) {
  const patterns = [];
  for (const m of matchedTerms) {
    for (const term of m.terms) {
      patterns.push({ regex: new RegExp("\\b" + escapeRegex(term) + "\\b", "gi"), cls: "acp-hl-matched" });
    }
  }
  for (const term of missingTerms) {
    patterns.push({ regex: new RegExp("\\b" + escapeRegex(term) + "\\b", "gi"), cls: "acp-hl-missing" });
  }
  if (patterns.length === 0) return;

  const walker = document.createTreeWalker(descEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  for (const textNode of textNodes) {
    if (textNode.parentElement?.closest("mark.acp-hl-matched, mark.acp-hl-missing")) continue;

    const text = textNode.textContent;
    const allMatches = [];
    for (const p of patterns) {
      p.regex.lastIndex = 0;
      let m;
      while ((m = p.regex.exec(text)) !== null) {
        allMatches.push({ start: m.index, end: m.index + m[0].length, text: m[0], cls: p.cls });
      }
    }

    allMatches.sort((a, b) => a.start - b.start || b.end - a.end);

    const merged = [];
    for (const am of allMatches) {
      if (merged.length && am.start < merged[merged.length - 1].end) continue;
      merged.push(am);
    }

    if (merged.length === 0) continue;

    let lastIdx = 0;
    const frag = document.createDocumentFragment();
    for (const am of merged) {
      if (am.start > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, am.start)));
      }
      const mark = document.createElement("mark");
      mark.className = am.cls;
      mark.textContent = am.text;
      frag.appendChild(mark);
      lastIdx = am.end;
    }
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }
}

function clearHighlightsFromElement(container) {
  const marks = container.querySelectorAll("mark.acp-hl-matched, mark.acp-hl-missing");
  for (const mark of marks) {
    const parent = mark.parentNode;
    const text = document.createTextNode(mark.textContent);
    parent.replaceChild(text, mark);
    parent.normalize();
  }
}

describe("Keyword Highlighting", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("highlights matched keywords with correct class", () => {
    document.body.innerHTML = `<div id="desc">Experience with React and TypeScript required.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [
      { terms: ["React"], matchType: "exact" },
      { terms: ["TypeScript"], matchType: "exact" },
    ], []);

    const marks = el.querySelectorAll("mark.acp-hl-matched");
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe("React");
    expect(marks[1].textContent).toBe("TypeScript");
  });

  it("highlights missing keywords with missing class", () => {
    document.body.innerHTML = `<div id="desc">Must know Docker and Kubernetes.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [], ["Docker", "Kubernetes"]);

    const marks = el.querySelectorAll("mark.acp-hl-missing");
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe("Docker");
    expect(marks[1].textContent).toBe("Kubernetes");
  });

  it("highlights both matched and missing", () => {
    document.body.innerHTML = `<div id="desc">We use React and need Docker skills.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [{ terms: ["React"], matchType: "exact" }], ["Docker"]);

    expect(el.querySelectorAll("mark.acp-hl-matched").length).toBe(1);
    expect(el.querySelectorAll("mark.acp-hl-missing").length).toBe(1);
  });

  it("handles case-insensitive matching", () => {
    document.body.innerHTML = `<div id="desc">REACT is our main framework, react components everywhere.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [{ terms: ["React"], matchType: "exact" }], []);

    const marks = el.querySelectorAll("mark.acp-hl-matched");
    expect(marks.length).toBe(2);
  });

  it("preserves non-matching text", () => {
    document.body.innerHTML = `<div id="desc">We need React developers.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [{ terms: ["React"], matchType: "exact" }], []);

    expect(el.textContent).toBe("We need React developers.");
  });

  it("handles overlapping matches by taking the first", () => {
    document.body.innerHTML = `<div id="desc">machine learning is important</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [
      { terms: ["machine learning"], matchType: "exact" },
      { terms: ["machine"], matchType: "semantic" },
    ], []);

    const marks = el.querySelectorAll("mark");
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe("machine learning");
  });

  it("does nothing with empty patterns", () => {
    document.body.innerHTML = `<div id="desc">Just text here.</div>`;
    const el = document.querySelector("#desc");

    highlightKeywordsInElement(el, [], []);

    expect(el.querySelectorAll("mark").length).toBe(0);
    expect(el.textContent).toBe("Just text here.");
  });
});

describe("Clear Highlights", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("removes all highlight marks and restores text", () => {
    document.body.innerHTML = `<div id="desc">We need <mark class="acp-hl-matched">React</mark> and <mark class="acp-hl-missing">Docker</mark> skills.</div>`;
    const el = document.querySelector("#desc");

    clearHighlightsFromElement(el);

    expect(el.querySelectorAll("mark").length).toBe(0);
    expect(el.textContent).toBe("We need React and Docker skills.");
  });

  it("does not affect non-ACP marks", () => {
    document.body.innerHTML = `<div id="desc"><mark class="other">keep</mark> and <mark class="acp-hl-matched">remove</mark></div>`;
    const el = document.querySelector("#desc");

    clearHighlightsFromElement(el);

    expect(el.querySelectorAll("mark").length).toBe(1);
    expect(el.querySelector("mark.other").textContent).toBe("keep");
  });

  it("normalizes text nodes after removal", () => {
    document.body.innerHTML = `<div id="desc">a <mark class="acp-hl-matched">b</mark> c</div>`;
    const el = document.querySelector("#desc");

    clearHighlightsFromElement(el);

    expect(el.childNodes.length).toBe(1);
    expect(el.textContent).toBe("a b c");
  });
});
