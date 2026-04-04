import { describe, expect, it } from "bun:test";
import type { Page } from "../content/types.js";
import { generateFeedXml } from "./feed.js";
import { generateSitemapXml } from "./sitemap.js";

const makePage = (
	slug: string,
	title: string,
	publishedDate: string | null,
	draft = false,
): Page => ({
	slug,
	dirPath: `/content${slug}`,
	filePath: `/content${slug}/index.md`,
	meta: {
		title,
		description: `Description for ${title}`,
		template: "default",
		published: {
			draft,
			publishedDate,
			updatedDate: null,
		},
		taxonomy: { tags: [], category: [] },
		raw: {},
	},
	markdown: `# ${title}`,
	html: `<h1>${title}</h1>`,
});

const pages: Page[] = [
	makePage("/blog/first", "First Post", "2026-04-01"),
	makePage("/blog/second", "Second Post", "2026-04-02"),
	makePage("/blog/draft", "Draft Post", null, true),
];

describe("generateFeedXml", () => {
	it("produces valid RSS 2.0 XML", () => {
		const xml = generateFeedXml(pages, {
			title: "My Blog",
			description: "A test blog",
			siteUrl: "https://example.com",
			author: "Test Author",
		});

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain("<channel>");
		expect(xml).toContain("<title>My Blog</title>");
	});

	it("includes page titles and links", () => {
		const xml = generateFeedXml(pages, {
			title: "My Blog",
			description: "A test blog",
			siteUrl: "https://example.com",
		});

		expect(xml).toContain("<title>First Post</title>");
		expect(xml).toContain("<title>Second Post</title>");
		expect(xml).toContain("<link>https://example.com/blog/first</link>");
		expect(xml).toContain("<link>https://example.com/blog/second</link>");
	});

	it("includes publication dates", () => {
		const xml = generateFeedXml(pages, {
			title: "My Blog",
			description: "A test blog",
			siteUrl: "https://example.com",
		});

		expect(xml).toContain("<pubDate>");
	});

	it("excludes drafts", () => {
		const xml = generateFeedXml(pages, {
			title: "My Blog",
			description: "A test blog",
			siteUrl: "https://example.com",
		});

		expect(xml).not.toContain("Draft Post");
	});

	it("sorts by date descending", () => {
		const xml = generateFeedXml(pages, {
			title: "My Blog",
			description: "A test blog",
			siteUrl: "https://example.com",
		});

		const firstIdx = xml.indexOf("First Post");
		const secondIdx = xml.indexOf("Second Post");
		// Second (newer) should appear before first
		expect(secondIdx).toBeLessThan(firstIdx);
	});
});

describe("generateSitemapXml", () => {
	it("produces valid sitemap XML", () => {
		const xml = generateSitemapXml(pages, "https://example.com");

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	it("includes URLs for published pages", () => {
		const xml = generateSitemapXml(pages, "https://example.com");

		expect(xml).toContain("<loc>https://example.com/blog/first</loc>");
		expect(xml).toContain("<loc>https://example.com/blog/second</loc>");
	});

	it("excludes drafts", () => {
		const xml = generateSitemapXml(pages, "https://example.com");

		expect(xml).not.toContain("/blog/draft");
	});
});
