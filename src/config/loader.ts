import fs from "node:fs";
import { parse as parseToml } from "smol-toml";
import { type BlattConfig, configSchema } from "./schema.js";

export type { BlattConfig } from "./schema.js";

export const defaultConfig: BlattConfig = configSchema.parse({});

export function parseConfig(tomlString: string | undefined): BlattConfig {
	if (!tomlString) {
		return defaultConfig;
	}
	const raw = parseToml(tomlString);
	return configSchema.parse(raw);
}

export function loadConfigFile(path: string): BlattConfig {
	try {
		const text = fs.readFileSync(path, "utf-8");
		return parseConfig(text);
	} catch {
		return defaultConfig;
	}
}
