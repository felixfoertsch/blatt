import { describe, expect, it } from "vitest";
import { resolveCollection } from "./collection.js";
import type { Page } from "./types.js";

function makePage(slug: string, publishedDate: string | null, draft = false): Page {
	return {
		slug,
		dirPath: `/content${slug}`,
		filePath: `/content${slug}/index.md`,
		meta: {
			title: slug.split("/").pop() ?? slug,
			description: "",
			template: "post",
			published: { draft, publishedDate, updatedDate: null },
			taxonomy: { tags: [], category: [] },
			raw: {},
		},
		markdown: "",
		html: "",
	};
}

const allPages: Page[] = [
	makePage("/blog", null), // index — excluded
	makePage("/blog/2026-04-01-first", "2026-04-01"),
	makePage("/blog/2026-04-02-second", "2026-04-02"),
	makePage("/blog/2026-04-03-third", "2026-04-03"),
	makePage("/blog/draft-post", null, true), // draft child
	makePage("/about", null), // different section — excluded
];

describe("resolveCollection", () => {
	it("collects direct children of the given path, excluding the index and other sections", () => {
		const result = resolveCollection(allPages, { from: "blog", sort: "published", order: "desc" });
		// Should find 4 children: first, second, third, draft-post — not /blog itself or /about
		expect(result).toHaveLength(4);
		const slugs = result.map((p) => p.slug);
		expect(slugs).not.toContain("/blog");
		expect(slugs).not.toContain("/about");
		expect(slugs).toContain("/blog/2026-04-01-first");
		expect(slugs).toContain("/blog/draft-post");
	});

	it("sorts by published date descending by default", () => {
		const result = resolveCollection(allPages, { from: "blog", sort: "published", order: "desc" });
		// Dated posts should come before undated (null sorts before any string, so draft-post ends up first or last)
		// The three dated posts should be in descending order among themselves
		const dated = result.filter((p) => p.meta.published.publishedDate !== null);
		expect(dated[0].slug).toBe("/blog/2026-04-03-third");
		expect(dated[1].slug).toBe("/blog/2026-04-02-second");
		expect(dated[2].slug).toBe("/blog/2026-04-01-first");
	});

	it("sorts ascending when order is asc", () => {
		const result = resolveCollection(allPages, { from: "blog", sort: "published", order: "asc" });
		const dated = result.filter((p) => p.meta.published.publishedDate !== null);
		expect(dated[0].slug).toBe("/blog/2026-04-01-first");
		expect(dated[1].slug).toBe("/blog/2026-04-02-second");
		expect(dated[2].slug).toBe("/blog/2026-04-03-third");
	});
});
