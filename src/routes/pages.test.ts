import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type BlattApp, createBlattApp } from "../app.js";
import { defaultConfig } from "../config/loader.js";

const fixturesDir = path.resolve(import.meta.dirname, "../../test/fixtures");

describe("page routes", () => {
	let app: BlattApp;

	beforeAll(async () => {
		app = await createBlattApp({
			contentDir: path.join(fixturesDir, "basic"),
			config: defaultConfig,
		});
	});

	afterAll(() => {
		app.cache.stop();
	});

	it("serves a page at /hello", async () => {
		const res = await app.hono.request("/hello");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("Hello World");
	});

	it("returns 404 for nonexistent pages", async () => {
		const res = await app.hono.request("/does-not-exist");
		expect(res.status).toBe(404);
	});
});

describe("draft access", () => {
	let app: BlattApp;

	const draftConfig = {
		...defaultConfig,
		server: {
			...defaultConfig.server,
			preview_token: "secret",
		},
	};

	beforeAll(async () => {
		app = await createBlattApp({
			contentDir: path.join(fixturesDir, "drafts"),
			config: draftConfig,
		});
	});

	afterAll(() => {
		app.cache.stop();
	});

	it("returns 404 for drafts without preview token", async () => {
		const res = await app.hono.request("/wip");
		expect(res.status).toBe(404);
	});

	it("shows drafts with correct preview token", async () => {
		const res = await app.hono.request("/wip?preview=secret");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("Draft");
	});
});
