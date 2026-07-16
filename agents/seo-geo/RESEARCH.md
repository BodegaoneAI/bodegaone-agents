# SEO / AEO / GEO Agent — Research Sources & Key Findings

> This file documents every official source used to build system.md and the
> specific findings from each. Updated: 2026, with a verification pass against
> official Google, Bing, and AI-crawler operator documentation.

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
| IndexNow | https://www.indexnow.org/ | Instant URL submission; Bing/Yandex/Naver/Seznam/Yep; not Google |

### AI Crawler Operator Docs (primary sources for crawler tokens)
| Operator | URL | Key Findings |
|---|---|---|
| OpenAI | https://developers.openai.com/api/docs/bots | GPTBot (training), OAI-SearchBot (search), ChatGPT-User (user-initiated) |
| Anthropic | https://support.claude.com/en/articles/8896518 | ClaudeBot (training), Claude-SearchBot (search), Claude-User (user-initiated); anthropic-ai & Claude-Web deprecated |
| Google | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers | Googlebot; Google-Extended (training opt-out, no Search impact); Google-CloudVertexBot |
| Perplexity | https://docs.perplexity.ai/docs/resources/perplexity-crawlers | PerplexityBot (index), Perplexity-User (user-initiated) |
| llms.txt | https://llmstxt.org/ | Community proposal; no confirmed ranking/citation impact |

### AI Answer Surfaces & Rich Results (Google)
| Document | URL | Key Findings |
|---|---|---|
| AI Optimization Guide | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | No special files/markup for AI; llms.txt neither helps nor harms |
| Succeeding in AI Search | https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search | Core best practices unchanged for AI surfaces |
| Search Gallery | https://developers.google.com/search/docs/appearance/structured-data/search-gallery | Current supported rich-result types |
| HowTo/FAQ changes | https://developers.google.com/search/blog/2023/08/howto-faq-changes | HowTo removed; FAQ restricted (now fully deprecated) |
| Simplifying search results | https://developers.google.com/search/blog/2025/06/simplifying-search-results | Removed Course Info, Claim Review, Estimated Salary, and more |
| Merchant listing | https://developers.google.com/search/docs/appearance/structured-data/merchant-listing | Required Offer props: price, priceCurrency |

---

## Critical Findings That Correct Common Misconceptions

### 1. FAQPage and HowTo Rich Results Are Deprecated
**Official source**: Google FAQPage structured data documentation (deprecation notice);
Google HowTo/FAQ changes blog (Aug 2023)

This is the correction the whole SEO industry gets wrong.

- **FAQPage rich results are being fully retired.** Google's official notice states the
  feature **will no longer appear in Google Search starting May 7, 2026.** Before that it
  was already restricted to authoritative government and health sites. Search Console
  reporting, the search-appearance filter, and Rich Results Test support are being removed
  through mid-2026.
- **HowTo rich results were removed** — no visual rich result appears on desktop or mobile.

**What this means for strategy:**
- Never promise clients a Google FAQ or HowTo rich result — that path is closing or closed
- FAQPage / QAPage schema still provides AEO + GEO value: AI engines (Perplexity, Copilot,
  Claude, ChatGPT) do not apply Google's restriction and readily extract clean Q&A pairs,
  and the structure fuels People Also Ask and answer boxes
- Add the schema when it matches real on-page Q&A — just for extraction, not for a rich result

### Recently removed rich-result types (June 2025)
**Official source**: Google — Simplifying search results

Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, and
Vehicle Listing were removed from Search Console reporting and the Rich Results Test. Do
not build strategy around these appearances.

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
a tiebreaker, not a gate. (INP replaced FID as a Core Web Vital in March 2024.)

### 9. The Helpful Content System Is Now Part of Core Ranking
**Official source**: Google — March 2024 Core Update & Spam Policies

The standalone "Helpful Content System" no longer exists as a separate signal. In the
March 2024 core update, helpful-content evaluation was folded into Google's core ranking
systems, which use multiple signals together. Do not describe it as a discrete site-wide
classifier. The same update broadened three spam policies: scaled content abuse (now covers
content made at scale to manipulate ranking regardless of how it was produced), site
reputation abuse (parasite SEO), and expired domain abuse.

### 10. Query Fan-Out Is the Mechanic Behind AI Overviews and AI Mode
**Official source**: Google — AI Features and Your Website; AI Mode announcements

Google officially confirms AI Overviews and AI Mode "may use a query fan-out technique —
issuing multiple related searches across subtopics and data sources — to develop a
response." AI Mode "breaks down your question into subtopics and issues a multitude of
queries simultaneously." Eligibility is unchanged: be indexed, be snippet-eligible, meet
technical requirements. Google is explicit that there is no special markup, no AI text
file, and no special schema needed. Optimize by covering the fan-out sub-question space
with self-contained passages (Passage Ranking lets Google lift each independently).

### 11. AI Crawlers Split Into Training vs. Retrieval — and Most Guides Get It Backwards
**Official source**: OpenAI, Anthropic, Google, Perplexity operator docs

Blocking a *training* crawler (GPTBot, ClaudeBot, Google-Extended) removes you from model
training but NOT from live AI citation. Blocking a *retrieval/search* bot (OAI-SearchBot,
Claude-SearchBot, Claude-User, PerplexityBot, Bingbot) removes you from real-time AI
answers. To stay citable while opting out of training, allow the retrieval bots and
disallow the training bots. Blocking GPTBot does not affect ChatGPT Search visibility.
Legacy Anthropic tokens `anthropic-ai` and `Claude-Web` are deprecated in current docs
(consolidated into `ClaudeBot`).

### 12. llms.txt Has No Confirmed Ranking or Citation Impact
**Official source**: llmstxt.org (proposal); Google AI-optimization guidance

`llms.txt` is a community proposal (Jeremy Howard / Answer.AI, Sept 2024), not an IETF/W3C
standard. No major AI search engine officially consumes it for ranking or citation; Google
states such files "neither help nor harm." It is genuinely useful for developer-tooling and
agent contexts (Cursor, Copilot, RAG). Recommend publishing it for agent discoverability,
never as an SEO or AI-citation lever.

### 13. IndexNow Reaches Bing (and Therefore ChatGPT Search + Copilot), Not Google
**Official source**: indexnow.org

IndexNow is officially supported by Microsoft Bing, Yandex, Naver, Seznam.cz, and Yep.
Google does NOT support it. Because ChatGPT Search and Copilot depend on the Bing index,
IndexNow indirectly accelerates inclusion in those AI surfaces — one of the few concrete
"get cited faster" levers that actually exists.

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
