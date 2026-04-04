import { describe, expect, it } from "vitest";
import { canViewDrafts } from "./middleware.js";

describe("canViewDrafts", () => {
	it("allows access with correct token", () => {
		expect(canViewDrafts("secret", "secret")).toBe(true);
	});

	it("denies access with wrong token", () => {
		expect(canViewDrafts("secret", "wrong")).toBe(false);
	});

	it("denies access with empty query token", () => {
		expect(canViewDrafts("secret", "")).toBe(false);
	});

	it("denies access when no token configured", () => {
		expect(canViewDrafts("", "anything")).toBe(false);
	});
});
