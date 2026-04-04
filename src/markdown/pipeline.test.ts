import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config/loader.js";
import { createMarkdownPipeline } from "./pipeline.js";

describe("markdown pipeline", () => {
	const pipeline = createMarkdownPipeline(defaultConfig.markdown);

	it("renders basic markdown to HTML", async () => {
		const result = await pipeline.render("# Hello\n\nA paragraph.");
		expect(result.html).toContain("<h1");
		expect(result.html).toContain("Hello");
		expect(result.html).toContain("<p>A paragraph.</p>");
	});

	it("renders GFM tables", async () => {
		const md = "| A | B |\n|---|---|\n| 1 | 2 |";
		const result = await pipeline.render(md);
		expect(result.html).toContain("<table>");
		expect(result.html).toContain("<td>1</td>");
	});

	it("renders footnotes", async () => {
		const md = "Text[^1].\n\n[^1]: Content.";
		const result = await pipeline.render(md);
		expect(result.html).toContain("footnote");
	});

	it("renders math with KaTeX", async () => {
		const md = "$E = mc^2$\n\n$$\\int_0^1 x^2 dx$$";
		const result = await pipeline.render(md);
		expect(result.html).toContain("katex");
	});

	it("renders fenced code with syntax highlighting", async () => {
		const md = "```js\nconst x = 1;\n```";
		const result = await pipeline.render(md);
		expect(result.html).toContain("<pre");
	});

	it("adds heading IDs and anchor links", async () => {
		const md = "## My Section";
		const result = await pipeline.render(md);
		expect(result.html).toContain('id="my-section"');
	});

	it("decorates external links", async () => {
		const md = "[example](https://example.com)";
		const result = await pipeline.render(md);
		expect(result.html).toContain('target="_blank"');
		expect(result.html).toContain("noopener");
	});

	it("renders admonitions", async () => {
		const md = ":::note\nThis is a note.\n:::";
		const result = await pipeline.render(md);
		expect(result.html).toContain("callout");
		expect(result.html).toContain("note");
	});

	it("renders smart typography", async () => {
		const md = `"Hello" -- world...`;
		const result = await pipeline.render(md);
		// Smart typography converts straight quotes to curly, -- to en-dash, ... to ellipsis
		expect(result.html).toContain("\u201C"); // left curly quote
		expect(result.html).toContain("\u2014"); // em-dash (remark-smartypants converts -- to em-dash)
		expect(result.html).toContain("\u2026"); // ellipsis
	});

	it("extracts TOC data", async () => {
		const md = "## Introduction\n\n### Details\n\n## Conclusion";
		const result = await pipeline.render(md);
		expect(result.toc).toHaveLength(3);
		expect(result.toc[0]).toEqual({
			text: "Introduction",
			depth: 2,
			id: "introduction",
		});
		expect(result.toc[1]).toEqual({
			text: "Details",
			depth: 3,
			id: "details",
		});
		expect(result.toc[2]).toEqual({
			text: "Conclusion",
			depth: 2,
			id: "conclusion",
		});
	});
});
