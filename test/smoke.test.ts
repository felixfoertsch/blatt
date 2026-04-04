import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBlattApp, type BlattApp } from "../src/app.js";
import { parseConfig } from "../src/config/loader.js";

const blogIndexMd = `---
title: Blog
template: collection
collect:
  from: blog
  sort: published
  order: desc
---
`;

const blogPostMd = `---
title: Test Post
published: 2026-04-04
template: post
description: A comprehensive test post
---

# Test Post

A paragraph with **bold** and *italic* text.

Inline math: $E = mc^2$

\`\`\`js
const x = 1;
console.log(x);
\`\`\`

## Section

A footnote reference.[^1]

:::note
This is an admonition callout.
:::

[^1]: Footnote content here.
`;

const aboutMd = `---
title: About
---

# About

This is the about page.
`;

let app: BlattApp;
let tmpDir: string;

beforeAll(async () => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blatt-smoke-"));

	// Create blog collection index
	const blogDir = path.join(tmpDir, "blog");
	fs.mkdirSync(blogDir, { recursive: true });
	fs.writeFileSync(path.join(blogDir, "index.md"), blogIndexMd);

	// Create blog post
	const postDir = path.join(tmpDir, "blog", "2026-04-04-test-post");
	fs.mkdirSync(postDir, { recursive: true });
	fs.writeFileSync(path.join(postDir, "index.md"), blogPostMd);

	// Create about page
	const aboutDir = path.join(tmpDir, "about");
	fs.mkdirSync(aboutDir, { recursive: true });
	fs.writeFileSync(path.join(aboutDir, "index.md"), aboutMd);

	const config = parseConfig(`
[site]
name = "Smoke Test Site"
url = "http://localhost:3000"

[feed]
enabled = true

[sitemap]
enabled = true
`);

	app = await createBlattApp({ contentDir: tmpDir, config });
});

afterAll(() => {
	app.cache.stop();
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("smoke tests", () => {
	it("serves the blog collection page", async () => {
		const res = await app.hono.request("/blog");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("Blog");
		expect(html).toContain("Test Post");
		expect(html).toContain("/blog/2026-04-04-test-post");
	});

	it("serves the blog post with all features", async () => {
		const res = await app.hono.request("/blog/2026-04-04-test-post");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("<strong>bold</strong>");
		expect(html).toContain("<em>italic</em>");
		expect(html).toContain("katex");
		expect(html).toContain("<pre");
		expect(html).toContain("footnote");
		expect(html).toContain("callout");
		expect(html).toContain('id="section"');
		expect(html).toContain("og:title");
		expect(html).toContain('rel="canonical"');
		expect(html).toContain("min read");
	});

	it("serves the about page", async () => {
		const res = await app.hono.request("/about");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("About");
	});

	it("returns 404 for nonexistent pages", async () => {
		const res = await app.hono.request("/does-not-exist");
		expect(res.status).toBe(404);
	});

	it("generates sitemap", async () => {
		const res = await app.hono.request("/sitemap.xml");
		expect(res.status).toBe(200);
		const xml = await res.text();
		expect(xml).toContain("urlset");
		expect(xml).toContain("/blog");
		expect(xml).toContain("/about");
	});

	it("generates RSS feed", async () => {
		const res = await app.hono.request("/feed.xml");
		expect(res.status).toBe(200);
		const xml = await res.text();
		expect(xml).toContain("rss");
		expect(xml).toContain("Test Post");
	});
});
