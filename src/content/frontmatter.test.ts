import { describe, expect, it } from "vitest";
import { parseFrontmatter, parsePublished } from "./frontmatter.js";

describe("parsePublished", () => {
	it("returns draft when value is false", () => {
		const result = parsePublished(false);
		expect(result.draft).toBe(true);
		expect(result.publishedDate).toBeNull();
		expect(result.updatedDate).toBeNull();
	});

	it("returns published with no dates when value is true", () => {
		const result = parsePublished(true);
		expect(result.draft).toBe(false);
		expect(result.publishedDate).toBeNull();
		expect(result.updatedDate).toBeNull();
	});

	it("returns published with no dates when value is undefined", () => {
		const result = parsePublished(undefined);
		expect(result.draft).toBe(false);
		expect(result.publishedDate).toBeNull();
		expect(result.updatedDate).toBeNull();
	});

	it("returns published with publishedDate when value is a date string", () => {
		const result = parsePublished("2026-04-04");
		expect(result.draft).toBe(false);
		expect(result.publishedDate).toBe("2026-04-04");
		expect(result.updatedDate).toBeNull();
	});

	it("returns published with publishedDate and updatedDate when value is two date strings", () => {
		const result = parsePublished("2026-04-04, 2026-04-10");
		expect(result.draft).toBe(false);
		expect(result.publishedDate).toBe("2026-04-04");
		expect(result.updatedDate).toBe("2026-04-10");
	});

	it("converts Date objects to YYYY-MM-DD strings (gray-matter auto-parse)", () => {
		// gray-matter auto-parses `published: 2026-04-04` (unquoted) as a JS Date
		const date = new Date(Date.UTC(2026, 3, 4)); // April 4, 2026 UTC
		const result = parsePublished(date);
		expect(result.draft).toBe(false);
		expect(result.publishedDate).toBe("2026-04-04");
		expect(result.updatedDate).toBeNull();
	});
});

describe("parseFrontmatter", () => {
	it("parses full frontmatter correctly", () => {
		const content = `---
title: Hello World
description: A test page
template: post
published: 2026-04-01
taxonomy:
  tags: [intro, test]
  category: [blog]
---

# Hello World

Body content here.
`;
		const { meta, markdown } = parseFrontmatter(content);
		expect(meta.title).toBe("Hello World");
		expect(meta.description).toBe("A test page");
		expect(meta.template).toBe("post");
		expect(meta.published.draft).toBe(false);
		expect(meta.published.publishedDate).toBe("2026-04-01");
		expect(meta.taxonomy.tags).toEqual(["intro", "test"]);
		expect(meta.taxonomy.category).toEqual(["blog"]);
		expect(markdown).toContain("# Hello World");
		expect(markdown).toContain("Body content here.");
	});

	it("handles missing frontmatter with safe defaults", () => {
		const content = `# No Frontmatter

Just a plain markdown file.
`;
		const { meta, markdown } = parseFrontmatter(content);
		expect(meta.title).toBe("");
		expect(meta.description).toBe("");
		expect(meta.template).toBe("default");
		expect(meta.published.draft).toBe(false);
		expect(meta.published.publishedDate).toBeNull();
		expect(meta.taxonomy.tags).toEqual([]);
		expect(meta.taxonomy.category).toEqual([]);
		expect(markdown).toContain("# No Frontmatter");
	});
});
