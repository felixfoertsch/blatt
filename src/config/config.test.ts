import { describe, expect, it } from "vitest";
import { defaultConfig, parseConfig } from "./loader.js";

describe("parseConfig", () => {
	it("returns defaults when called with undefined", () => {
		const config = parseConfig(undefined);
		expect(config.site.name).toBe("Blatt");
		expect(config.site.url).toBe("http://localhost:3000");
		expect(config.site.language).toBe("en");
		expect(config.server.port).toBe(3000);
		expect(config.markdown.syntax_highlighting).toBe(true);
		expect(config.feed.enabled).toBe(true);
		expect(config.feed.path).toBe("/feed.xml");
		expect(config.sitemap.enabled).toBe(true);
		expect(config.sitemap.path).toBe("/sitemap.xml");
	});

	it("parses a valid TOML string with overrides", () => {
		const toml = `
[site]
name = "My Blog"
url = "https://example.com"
language = "de"
description = "A test blog"
author = "Felix"

[server]
port = 8080
preview_token = "secret123"

[markdown]
syntax_highlighting = false
math = false

[feed]
enabled = false
path = "/rss.xml"

[sitemap]
enabled = false
path = "/map.xml"
`;
		const config = parseConfig(toml);
		expect(config.site.name).toBe("My Blog");
		expect(config.site.url).toBe("https://example.com");
		expect(config.site.language).toBe("de");
		expect(config.site.description).toBe("A test blog");
		expect(config.site.author).toBe("Felix");
		expect(config.server.port).toBe(8080);
		expect(config.server.preview_token).toBe("secret123");
		expect(config.markdown.syntax_highlighting).toBe(false);
		expect(config.markdown.math).toBe(false);
		expect(config.feed.enabled).toBe(false);
		expect(config.feed.path).toBe("/rss.xml");
		expect(config.sitemap.enabled).toBe(false);
		expect(config.sitemap.path).toBe("/map.xml");
	});

	it("merges partial config with defaults", () => {
		const toml = `
[site]
name = "Partial Site"
`;
		const config = parseConfig(toml);
		// Overridden value
		expect(config.site.name).toBe("Partial Site");
		// Defaults preserved for other site fields
		expect(config.site.url).toBe("http://localhost:3000");
		expect(config.site.language).toBe("en");
		expect(config.site.description).toBe("");
		// Defaults preserved for other sections
		expect(config.server.port).toBe(3000);
		expect(config.markdown.syntax_highlighting).toBe(true);
		expect(config.feed.enabled).toBe(true);
		expect(config.sitemap.enabled).toBe(true);
	});
});

describe("defaultConfig", () => {
	it("has all expected default values", () => {
		expect(defaultConfig).toEqual(parseConfig(undefined));
	});
});
