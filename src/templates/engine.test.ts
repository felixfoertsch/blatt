import path from "node:path";
import { describe, expect, it } from "vitest";
import type { BlattConfig } from "../config/schema.js";
import { createTemplateEngine } from "./engine.js";

const builtinDir = path.resolve(import.meta.dirname, "../../templates");

const config: BlattConfig = {
	site: {
		name: "Test Site",
		url: "http://localhost:3000",
		language: "en",
		description: "",
		author: "",
	},
	server: { port: 3000, preview_token: "" },
	markdown: {
		syntax_highlighting: false,
		footnotes: false,
		smart_typography: false,
		heading_anchors: false,
		figure_captions: false,
		external_links: false,
		toc: false,
		math: false,
		admonitions: false,
		definition_lists: false,
		task_lists: false,
		mermaid: false,
		abbreviations: false,
		superscript_subscript: false,
		highlight_mark: false,
	},
	feed: { enabled: false, path: "/feed.xml" },
	sitemap: { enabled: false, path: "/sitemap.xml" },
};

describe("createTemplateEngine", () => {
	it("renders default template with content", () => {
		const engine = createTemplateEngine(undefined, builtinDir);
		const html = engine.render("default", {
			title: "Hello World",
			content: "<p>Test content</p>",
			meta_tags: "",
			draft_banner: false,
			config,
		});
		expect(html).toContain("Hello World");
		expect(html).toContain("Test content");
		expect(html).toContain("Powered by Blatt");
	});

	it("renders post template with date and reading time", () => {
		const engine = createTemplateEngine(undefined, builtinDir);
		const html = engine.render("post", {
			title: "My Post",
			content: "<p>Post body</p>",
			published_date: "2026-04-01",
			updated_date: null,
			reading_time: "3 min read",
			taxonomy: { tags: ["rust"], category: [] },
			meta_tags: "",
			draft_banner: false,
			config,
		});
		expect(html).toContain("My Post");
		expect(html).toContain("2026-04-01");
		expect(html).toContain("3 min read");
		expect(html).toContain("rust");
	});

	it("renders collection template with page list", () => {
		const engine = createTemplateEngine(undefined, builtinDir);
		const html = engine.render("collection", {
			title: "Blog",
			content: "",
			meta_tags: "",
			draft_banner: false,
			config,
			pages: [
				{
					title: "First Post",
					slug: "/blog/first",
					published_date: "2026-01-01",
					description: "A post",
					draft: false,
				},
				{
					title: "Second Post",
					slug: "/blog/second",
					published_date: "2026-02-01",
					description: "",
					draft: false,
				},
			],
		});
		expect(html).toContain("First Post");
		expect(html).toContain("Second Post");
		expect(html).toContain("/blog/first");
		expect(html).toContain("2026-01-01");
	});

	it("falls back to default for unknown template names", () => {
		const engine = createTemplateEngine(undefined, builtinDir);
		const html = engine.render("nonexistent-template-xyz", {
			title: "Fallback Test",
			content: "<p>Fallback content</p>",
			meta_tags: "",
			draft_banner: false,
			config,
		});
		expect(html).toContain("Fallback Test");
		expect(html).toContain("Fallback content");
	});
});
