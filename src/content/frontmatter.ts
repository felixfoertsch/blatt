import matter from "gray-matter";
import type { PageMeta, PublishedInfo } from "./types.js";

function dateToIso(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * Parse the `published` frontmatter field into a PublishedInfo struct.
 *
 * Accepted values:
 *   false              → draft, no dates
 *   true / undefined   → published, no dates
 *   "2026-04-04"       → published with publishedDate
 *   "2026-04-04, 2026-04-10" → published with publishedDate + updatedDate
 *   Date object        → published with publishedDate (gray-matter auto-parses unquoted YAML dates)
 */
export function parsePublished(value: unknown): PublishedInfo {
	// Explicit false → draft
	if (value === false) {
		return { draft: true, publishedDate: null, updatedDate: null };
	}

	// gray-matter auto-parses unquoted YAML dates into JS Date objects
	if (value instanceof Date) {
		return { draft: false, publishedDate: dateToIso(value), updatedDate: null };
	}

	// undefined or true → published, no date
	if (value === undefined || value === true) {
		return { draft: false, publishedDate: null, updatedDate: null };
	}

	// String: "YYYY-MM-DD" or "YYYY-MM-DD, YYYY-MM-DD"
	if (typeof value === "string") {
		const parts = value.split(",").map((s) => s.trim());
		const publishedDate = parts[0] ?? null;
		const updatedDate = parts[1] ?? null;
		return { draft: false, publishedDate, updatedDate };
	}

	// Fallback: treat as published with no date
	return { draft: false, publishedDate: null, updatedDate: null };
}

export function parseFrontmatter(fileContent: string): {
	meta: PageMeta;
	markdown: string;
} {
	const { data, content } = matter(fileContent);

	const raw = data as Record<string, unknown>;

	const title = typeof raw.title === "string" ? raw.title : "";
	const description = typeof raw.description === "string" ? raw.description : "";
	const template = typeof raw.template === "string" ? raw.template : "default";

	const published = parsePublished(raw.published);

	const taxonomyRaw = raw.taxonomy as Record<string, unknown> | undefined;
	const tags = Array.isArray(taxonomyRaw?.tags)
		? (taxonomyRaw.tags as string[]).filter((t) => typeof t === "string")
		: [];
	const category = Array.isArray(taxonomyRaw?.category)
		? (taxonomyRaw.category as string[]).filter((c) => typeof c === "string")
		: [];

	const meta: PageMeta = {
		title,
		description,
		template,
		published,
		taxonomy: { tags, category },
		raw,
	};

	return { meta, markdown: content.trimStart() };
}
