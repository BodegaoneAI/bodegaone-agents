# SEO/GEO Agent — Research Sources & Key Findings

> This file documents every official source used to build system.md and the
> specific findings from each. Updated: April 2026.

---

## Official Sources Used

### Google Search Central
| Document | URL | Key Findings |
|---|---|---|
| Search Essentials | https://developers.google.com/search/docs/essentials | 3 technical requirements; spam policy categories |
| Spam Policies | https://developers.google.com/search/docs/essentials/spam-policies | 15+ spam categories including scaled content abuse |
| Helpful Content | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | E-E-A-T framework; Who/How/Why test; red flags |
| SEO Starter Guide | https://developers.google.com/search/docs/fundamentals/seo-starter-guide | Official best practices; what NOT to focus on |
| Technical Requirements | https://developers.google.com/search/docs/essentials/technical | HTTP 200 requirement; indexable content rules |
| Ranking Systems | https://developers.google.com/search/docs/appearance/ranking-systems-guide | All active ranking systems documented |
| Core Web Vitals | https://developers.google.com/search/docs/appearance/core-web-vitals | LCP < 2.5s; INP < 200ms; CLS < 0.1 |
| Structured Data Policies | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | JSON-LD recommended; visibility required; no deception |
| FAQPage Schema | https://developers.google.com/search/docs/appearance/structured-data/faqpage | Restricted to gov/health sites for rich results |
| Structured Data Intro | https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data | Supported types; rich result case studies |
| Title Links | https://developers.google.com/search/docs/appearance/title-link | Title requirements; how Google generates titles |
| Snippets | https://developers.google.com/search/docs/appearance/snippet | Meta description rules; nosnippet controls |
| Crawlable Links | https://developers.google.com/search/docs/crawling-indexing/links-crawlable | `<a href>` requirement; rel attribute rules |
| Sitemaps | https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview | When sitemaps help; 500+ page recommendation |
| AI Features | https://developers.google.com/search/docs/appearance/ai-features | No special requirements for AI Overviews; query fan-out |
| AI-Generated Content | https://developers.google.com/search/docs/fundamentals/using-gen-ai-content | AI content OK if quality; mass generation = spam |
| Page Experience | https://developers.google.com/search/docs/appearance/page-experience | CWV + HTTPS + mobile + no intrusive interstitials |
| Feb 2026 Discover Update | https://developers.google.com/search/blog/2026/02/discover-core-update | Locally relevant, original, in-depth content preferred |

### Bing / Microsoft
| Document | URL | Key Findings |
|---|---|---|
| Webmaster Guidelines | https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a | GEO definition; meta tag controls; content quality flags |
| Content Quality Issues | https://learn.microsoft.com/en-us/answers/questions/5556941/how-to-fix-content-quality-issues-in-bing-webmaste | Specific flags: thin, auto-translated, low engagement |
| GEO in Bing Guidelines | https://www.searchenginejournal.com/bing-adds-geo-to-official-guidelines-expands-ai-abuse-definitions/568442/ | Official GEO definition; entity naming; single-topic pages |

---

## Critical Findings That Correct Common Misconceptions

### 1. FAQPage Rich Results Are Restricted
**Official source**: Google FAQPage structured data documentation

FAQPage rich results (the visual Q&A display in Google Search) are **limited to
well-known, authoritative government-focused or health-focused websites.**

Most sites will never see the visual FAQPage rich result in Google Search, regardless
of how correctly the schema is implemented.

**What this means for strategy:**
- Do not promise clients FAQPage rich results will appear
- FAQPage schema still provides GEO value (AI engines don't apply this restriction)
- Perplexity, Copilot, Claude, and ChatGPT extract FAQ content regardless of Google's rich result restriction
- The schema signals content organization to all crawlers

### 2. E-E-A-T Is Not a Direct Ranking Factor
**Official source**: Google SEO Starter Guide — explicitly states "E-E-A-T is not a ranking factor"

**The nuance**: There is no direct E-E-A-T score in Google's ranking algorithm. However,
the *signals that contribute to E-E-A-T* (links, author attribution, content accuracy,
brand mentions, site reputation) ARE evaluated by Google's systems and quality raters.

**What this means for strategy:**
- Don't tell clients to "improve their E-E-A-T score" as if it's a measurable metric
- Do implement the signals: author attribution, organization schema, cited statistics, trust signals
- Quality Raters use E-E-A-T to evaluate sites, which feeds into algorithm training

### 3. Google AI Overviews Need No Special Optimization
**Official source**: Google — AI Features and Your Website

Google explicitly states: "There are no additional requirements to appear in AI Overviews
or AI Mode, nor other special optimizations necessary."

No special schema, no AI text files, no custom markup.

**What this means for strategy:**
- Rank well in standard Google Search → you're already eligible for AI Overviews
- Focus on standard SEO quality signals
- AI Overview citation is a byproduct of good SEO, not a separate optimization track

### 4. Bing Is Formally the First Engine to Define GEO
**Official source**: Bing Webmaster Guidelines update

Bing added GEO to its official guidelines before Google. Bing defines it as
"content optimization focused on content eligibility for grounding and reference in AI responses."

**Bing's GEO requirements (official)**:
- Factual clarity (information presented directly, not implied)
- Entity naming (clear and consistent names/references)
- Single-topic pages with essential info near the top

### 5. NOCACHE/NOARCHIVE Meta Tags Block Copilot and ChatGPT
**Official source**: Bing Webmaster Guidelines

Most sites don't know this, but:
- `<meta name="robots" content="NOARCHIVE">` = Bing Copilot will NOT use this page
- `<meta name="robots" content="NOCACHE">` = Copilot gets URL/title/snippet only

Many WordPress templates or security plugins set NOARCHIVE by default. This silently
blocks Copilot and ChatGPT (which uses Bing index) from citing your content.

**What to check**: Inspect page source for `<meta name="robots">` on key pages.

### 6. Duplicate Content "Penalty" Doesn't Exist
**Official source**: Google SEO Starter Guide

Google explicitly states the duplicate content "penalty" doesn't exist.
Duplicate content is inefficient (splits link equity, confuses canonicalization)
but does not trigger a manual penalty.

**What this means**: Canonical tags and redirects are best practices for efficiency,
not "penalty prevention."

### 7. Keyword Meta Tag Is Ignored by Google
**Official source**: Google SEO Starter Guide — "Google Search doesn't use the keywords meta tag"

### 8. Core Web Vitals Are Contributing Signals, Not Deal-Breakers
**Official source**: Google — Page Experience documentation

"Google Search always seeks to show the most relevant content, even if the page
experience is sub-par." CWV helps when competing content is similar in quality — it's
a tiebreaker, not a gate.

---

## Important Distinctions: Official vs. Observed

The system.md clearly distinguishes between:

| Type | What It Means |
|---|---|
| **Official requirement** | Documented in official Google/Bing docs. Violation risks demotion/removal. |
| **Official best practice** | Recommended in official docs. Not following it may hurt performance. |
| **GEO pattern (observed)** | Based on observable AI engine behavior. Not officially documented. May change. |

Anything labeled "observed" in system.md should be treated as directional guidance,
not guaranteed behavior. AI engines update their citation logic frequently.

---

## Research Gaps (Things to Investigate Further)

- Perplexity's official documentation on citation selection (limited public info)
- ChatGPT Search's official ranking signals (not publicly documented)
- Claude web search (Brave) official crawler documentation
- Google's official stance on GEO as a distinct discipline
- Whether Google's February 2026 Discover update signals apply to main search results
