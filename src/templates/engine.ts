import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";

export interface TemplateEngine {
	render(templateName: string, context: Record<string, unknown>): string;
}

export function createTemplateEngine(
	userTemplatesDir?: string,
	builtinTemplatesDir?: string,
): TemplateEngine {
	const builtinDir = builtinTemplatesDir ?? path.resolve(import.meta.dirname, "../../templates");
	const searchPaths: string[] = [];
	if (userTemplatesDir && fs.existsSync(userTemplatesDir)) {
		searchPaths.push(userTemplatesDir);
	}
	searchPaths.push(builtinDir);

	const env = nunjucks.configure(searchPaths, {
		autoescape: false,
		noCache: true,
	});

	return {
		render(templateName: string, context: Record<string, unknown>): string {
			const fileName = `${templateName}.html`;
			const exists = searchPaths.some((dir) => fs.existsSync(path.join(dir, fileName)));
			const resolvedTemplate = exists ? fileName : "default.html";
			return env.render(resolvedTemplate, context);
		},
	};
}
