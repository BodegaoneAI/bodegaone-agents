/**
 * mcp/lib/html.ts
 * Pure HTML parsing utilities.
 * Exported for unit testing.
 */

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function extractSchemaTypes(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const types: string[] = [];
  if (Array.isArray(data)) {
    for (const item of data) types.push(...extractSchemaTypes(item));
  } else {
    const obj = data as Record<string, unknown>;
    if (obj["@type"]) {
      if (Array.isArray(obj["@type"])) {
        types.push(...(obj["@type"] as string[]));
      } else {
        types.push(obj["@type"] as string);
      }
    }
    for (const val of Object.values(obj)) {
      if (typeof val === "object") types.push(...extractSchemaTypes(val));
    }
  }
  return types;
}
