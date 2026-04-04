import { visit } from "unist-util-visit";

export function remarkAdmonitions() {
	// remark-directive adds containerDirective nodes which aren't in base mdast types
	return (tree: unknown) => {
		visit(tree as import("unist").Node, (node) => {
			if ((node as { type: string }).type !== "containerDirective") return;
			const directive = node as unknown as Record<string, unknown>;
			const name = directive.name as string;
			const validTypes = ["note", "tip", "warning", "danger", "info"];
			if (!validTypes.includes(name)) return;
			const data = (directive.data ?? {}) as Record<string, unknown>;
			directive.data = data;
			data.hName = "aside";
			data.hProperties = { class: `callout callout-${name}`, role: "note" };
		});
	};
}
