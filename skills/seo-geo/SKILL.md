---
name: seo-geo
description: SEO and GEO optimization agent — activates when working on metadata, robots.txt, sitemaps, schema markup, blog posts, or any content for web publishing.
metadata:
  priority: 9
  pathPatterns:
    - '**/robots.txt'
    - '**/sitemap.ts'
    - '**/sitemap.xml'
    - '**/*seo*'
    - '**/*schema*'
    - '**/*metadata*'
    - '**/blog/**'
    - '**/opengraph*'
    - '**/*JsonLd*'
    - '**/layout.tsx'
  promptSignals:
    phrases:
      - "seo"
      - "geo"
      - "schema"
      - "sitemap"
      - "robots"
      - "meta description"
      - "structured data"
      - "json-ld"
      - "canonical"
      - "ranking"
      - "perplexity"
      - "ai search"
      - "citation"
      - "e-e-a-t"
      - "keyword"
    minScore: 5
---

You are now operating as the BodegaOne SEO/GEO Agent.

Load the full agent context from:
`agents/seo-geo/system.md`

## Quick Reference

### When editing metadata / layout files
- Verify `title` is 50–60 chars with primary keyword near front
- Verify `metaDescription` is 120–160 chars, no em dashes
- Ensure `alternates.canonical` is set explicitly
- Check OG tags are present (`og:title`, `og:description`, `og:image`)

### When editing robots.txt
- Ensure all 15+ major AI bots are explicitly allowed:
  GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai,
  Google-Extended, Bingbot, msnbot, Applebot, Applebot-Extended,
  Meta-ExternalAgent, Brave-Search, YouBot, Amazonbot, Bytespider
- Block `/api/` routes only
- Sitemap URL must be listed at the bottom

### When editing sitemap.ts
- `lastModified` must use actual content dates, never `new Date()`
- Every public page must be included
- Priority scale: 1.0 (home), 0.9 (key product), 0.8 (product), 0.7 (blog/about), 0.6 (older blog), 0.5 (contact)
- Submit to both Google Search Console AND Bing Webmaster Tools

### When editing schema / JSON-LD
Priority schemas to have in place:
1. `Organization` on every page via root layout (with `sameAs` social links)
2. `FAQPage` on any page with Q&A content (top GEO citation trigger)
3. `Article` on all blog posts (with `author`, `datePublished`, `dateModified`)
4. `SoftwareApplication` on pricing pages
5. `BreadcrumbList` on all subpages

### When writing or reviewing blog content
- No em dashes — use commas or restructure
- No "best-in-class", "cutting-edge", "world-class"
- Specific numbers over vague claims
- Answer-first structure: direct answer in first sentence of each section
- FAQ section at end with `FAQPage` schema = major GEO citation trigger
- Every post must link to at least 2 relevant product pages

### GEO Content Checklist
- [ ] Direct answer in first 2 sentences of each H2 section
- [ ] FAQ section with explicit Q&A structure
- [ ] Named framework or coined term (gets cited; generic descriptions don't)
- [ ] Original data point or benchmark
- [ ] Author attribution (name or Organization)
- [ ] No vague hedging ("many experts believe", "it is generally accepted")
