# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.x (current) | ✅ Yes |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in BodegaOne Agents — including vulnerabilities in
the MCP tools, the hook system, or any dependency — please report it privately:

**Email:** security@bodegaone.ai

Include in your report:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (if any)

We will acknowledge your report within **48 hours** and aim to release a fix within
**7 days** for critical issues. We'll credit you in the changelog unless you prefer
to remain anonymous.

## Supply Chain

This package is distributed via npm as `bodegaone-agents`. Users install it via
`npx bodegaone-agents --stdio` and it runs as a local MCP server.

If you discover a compromised dependency or a supply chain issue, treat it as a
critical vulnerability and report immediately.

## Scope

In scope:
- Code execution vulnerabilities in MCP tool handlers
- Prompt injection via malicious page content processed by `seo_fetch_page`
- Path traversal in `seo_save_report` output directory handling
- Hook script (`inject-skill.mjs`) exploits
- Any dependency with a known CVE

Out of scope:
- Issues in third-party LLM providers (Claude, GPT, etc.)
- Issues in the MCP SDK itself (report to Anthropic/SDK maintainers)
- Social engineering attacks
