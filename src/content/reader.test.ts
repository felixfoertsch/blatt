import path from "node:path";
import { describe, expect, it } from "vitest";
import { readPages } from "./reader.js";
import { isCollectionPage } from "./types.js";

const fixtures = path.resolve(import.meta.dirname, "../../test/fixtures");

describe("readPages — basic fixture", () => {
	it("reads a simple page and produces one entry at /hello", () => {
		const pages = readPages(path.join(fixtures, "basic"));
		expect(pages).toHaveLength(1);
		const page = pages[0];
		expect(page.slug).toBe("/hello");
		expect(page.meta.title).toBe("Hello World");
		expect(page.meta.published.publishedDate).toBe("2026-04-01");
		expect(page.markdown).toContain("This is a test page.");
		expect(page.html).toBe("");
	});
});

describe("readPages — blog fixture", () => {
	it("reads the nested blog structure and produces 3 pages", () => {
		const pages = readPages(path.join(fixtures, "blog"));
		expect(pages).toHaveLength(3);

		const slugs = pages.map((p) => p.slug).sort();
		expect(slugs).toContain("/");
		expect(slugs).toContain("/2026-04-01-first");
		expect(slugs).toContain("/2026-04-02-second");
	});

	it("detects the blog index as a collection page", () => {
		const pages = readPages(path.join(fixtures, "blog"));
		const index = pages.find((p) => p.slug === "/");
		expect(index).toBeDefined();
		if (!index) throw new Error("index not found");
		expect(isCollectionPage(index)).toBe(true);
		if (isCollectionPage(index)) {
			expect(index.collect.from).toBe(".");
			expect(index.collect.sort).toBe("published");
			expect(index.collect.order).toBe("desc");
		}
	});

	it("reads post pages with correct metadata", () => {
		const pages = readPages(path.join(fixtures, "blog"));
		const first = pages.find((p) => p.slug === "/2026-04-01-first");
		expect(first).toBeDefined();
		expect(first?.meta.title).toBe("First Post");
		expect(first?.meta.template).toBe("post");
		expect(first?.meta.taxonomy.tags).toEqual(["intro"]);
	});
});

describe("readPages — drafts fixture", () => {
	it("marks pages with published: false as drafts", () => {
		const pages = readPages(path.join(fixtures, "drafts"));
		expect(pages).toHaveLength(1);
		const page = pages[0];
		expect(page.slug).toBe("/wip");
		expect(page.meta.published.draft).toBe(true);
		expect(page.meta.title).toBe("Work In Progress");
	});
});
