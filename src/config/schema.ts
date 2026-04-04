import { z } from "zod";

export const siteSchema = z.object({
	name: z.string().default("Blatt"),
	url: z.string().default("http://localhost:3000"),
	language: z.string().default("en"),
	description: z.string().default(""),
	author: z.string().default(""),
});

export const serverSchema = z.object({
	port: z.number().default(3000),
	preview_token: z.string().default(""),
});

export const markdownSchema = z.object({
	syntax_highlighting: z.boolean().default(true),
	footnotes: z.boolean().default(true),
	smart_typography: z.boolean().default(true),
	heading_anchors: z.boolean().default(true),
	figure_captions: z.boolean().default(true),
	external_links: z.boolean().default(true),
	toc: z.boolean().default(true),
	math: z.boolean().default(true),
	admonitions: z.boolean().default(true),
	definition_lists: z.boolean().default(true),
	task_lists: z.boolean().default(true),
	mermaid: z.boolean().default(true),
	abbreviations: z.boolean().default(true),
	superscript_subscript: z.boolean().default(true),
	highlight_mark: z.boolean().default(true),
});

export const feedSchema = z.object({
	enabled: z.boolean().default(true),
	path: z.string().default("/feed.xml"),
});

export const sitemapSchema = z.object({
	enabled: z.boolean().default(true),
	path: z.string().default("/sitemap.xml"),
});

export const configSchema = z.object({
	site: siteSchema.default({}),
	server: serverSchema.default({}),
	markdown: markdownSchema.default({}),
	feed: feedSchema.default({}),
	sitemap: sitemapSchema.default({}),
});

export type BlattConfig = z.infer<typeof configSchema>;
