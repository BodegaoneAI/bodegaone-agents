/**
 * tests/unit/html-parser.test.ts
 * Tests for stripTags(), decodeHtml(), extractSchemaTypes()
 */
import { describe, it, expect } from "vitest";
import {
  stripTags,
  decodeHtml,
  extractSchemaTypes,
} from "../../mcp/lib/html.js";

// ── stripTags ─────────────────────────────────────────────────────────────────

describe("stripTags", () => {
  it("removes simple HTML tags", () => {
    expect(stripTags("<p>Hello</p>")).toBe("Hello");
  });

  it("removes nested tags", () => {
    expect(stripTags("<div><p>Hello <strong>world</strong></p></div>")).toBe(
      "Hello world"
    );
  });

  it("collapses multiple whitespace into single spaces", () => {
    expect(stripTags("<p>Hello   world</p>")).toBe("Hello world");
  });

  it("handles self-closing tags", () => {
    expect(stripTags("<p>Hello<br/>world</p>")).toBe("Hello world");
  });

  it("handles tags with attributes", () => {
    expect(stripTags('<a href="https://example.com" class="link">Click</a>')).toBe("Click");
  });

  it("returns empty string for HTML with no text content", () => {
    expect(stripTags("<div><span></span></div>")).toBe("");
  });

  it("handles empty string", () => {
    expect(stripTags("")).toBe("");
  });

  it("leaves plain text unchanged", () => {
    expect(stripTags("Hello world")).toBe("Hello world");
  });
});

// ── decodeHtml ────────────────────────────────────────────────────────────────

describe("decodeHtml", () => {
  it("decodes &amp;", () => {
    expect(decodeHtml("AT&amp;T")).toBe("AT&T");
  });

  it("decodes &lt; and &gt;", () => {
    expect(decodeHtml("1 &lt; 2 &gt; 0")).toBe("1 < 2 > 0");
  });

  it("decodes &quot;", () => {
    expect(decodeHtml('Say &quot;hello&quot;')).toBe('Say "hello"');
  });

  it("decodes &#039;", () => {
    expect(decodeHtml("it&#039;s fine")).toBe("it's fine");
  });

  it("decodes &nbsp;", () => {
    expect(decodeHtml("Hello&nbsp;world")).toBe("Hello world");
  });

  it("handles multiple entities in one string", () => {
    expect(decodeHtml("&lt;h1&gt;Hello &amp; World&lt;/h1&gt;")).toBe(
      "<h1>Hello & World</h1>"
    );
  });

  it("leaves non-entity text unchanged", () => {
    expect(decodeHtml("plain text")).toBe("plain text");
  });

  it("handles empty string", () => {
    expect(decodeHtml("")).toBe("");
  });
});

// ── extractSchemaTypes ────────────────────────────────────────────────────────

describe("extractSchemaTypes", () => {
  it("extracts a single @type string", () => {
    const data = { "@type": "Organization", name: "Acme" };
    expect(extractSchemaTypes(data)).toContain("Organization");
  });

  it("extracts @type arrays", () => {
    const data = { "@type": ["Person", "Author"] };
    expect(extractSchemaTypes(data)).toEqual(
      expect.arrayContaining(["Person", "Author"])
    );
  });

  it("extracts @type from nested objects", () => {
    const data = {
      "@type": "Article",
      author: { "@type": "Person", name: "Jane" },
    };
    const types = extractSchemaTypes(data);
    expect(types).toContain("Article");
    expect(types).toContain("Person");
  });

  it("extracts @type from array of objects (graph pattern)", () => {
    const data = [
      { "@type": "Organization", name: "Acme" },
      { "@type": "WebSite", url: "https://example.com" },
    ];
    const types = extractSchemaTypes(data);
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
  });

  it("handles FAQPage with nested Question types", () => {
    const data = {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "What?" },
        { "@type": "Question", name: "Why?" },
      ],
    };
    const types = extractSchemaTypes(data);
    expect(types).toContain("FAQPage");
    expect(types.filter((t) => t === "Question")).toHaveLength(2);
  });

  it("returns empty array for null input", () => {
    expect(extractSchemaTypes(null)).toEqual([]);
  });

  it("returns empty array for non-object input", () => {
    expect(extractSchemaTypes("string")).toEqual([]);
    expect(extractSchemaTypes(42)).toEqual([]);
  });

  it("returns empty array for object with no @type", () => {
    expect(extractSchemaTypes({ name: "No type here" })).toEqual([]);
  });
});
