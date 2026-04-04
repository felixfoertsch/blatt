import { describe, expect, it } from "vitest";
import { calculateReadingTime, generateMetaTags } from "./meta.js";

describe("calculateReadingTime", () => {
	it("calculates 2 min read for 400 words", () => {
		const words = "word ".repeat(400).trim();
		expect(calculateReadingTime(words)).toBe("2 min read");
	});

	it("returns 1 min read for short text", () => {
		expect(calculateReadingTime("Hello world")).toBe("1 min read");
		expect(calculateReadingTime("")).toBe("1 min read");
	});
});

describe("generateMetaTags", () => {
	it("includes Open Graph tags and canonical URL", () => {
		const html = generateMetaTags({
			title: "My Article",
			description: "An interesting article",
			url: "https://example.com/blog/my-article",
			siteName: "My Site",
		});
		expect(html).toContain('rel="canonical"');
		expect(html).toContain("https://example.com/blog/my-article");
		expect(html).toContain('property="og:title"');
		expect(html).toContain("My Article");
		expect(html).toContain('property="og:description"');
		expect(html).toContain("An interesting article");
		expect(html).toContain('property="og:site_name"');
		expect(html).toContain("My Site");
	});

	it("includes JSON-LD for dated posts", () => {
		const html = generateMetaTags({
			title: "Dated Post",
			url: "https://example.com/blog/dated",
			author: "Felix",
			publishedDate: "2026-04-01",
			updatedDate: "2026-04-02",
		});
		expect(html).toContain("application/ld+json");
		expect(html).toContain('"@type":"Article"');
		expect(html).toContain('"datePublished":"2026-04-01"');
		expect(html).toContain('"dateModified":"2026-04-02"');
		expect(html).toContain('"name":"Felix"');
	});

	it("omits JSON-LD for undated pages", () => {
		const html = generateMetaTags({
			title: "Undated Page",
			url: "https://example.com/about",
		});
		expect(html).not.toContain("application/ld+json");
		expect(html).toContain('rel="canonical"');
		expect(html).toContain('og:type" content="website"');
	});
});
