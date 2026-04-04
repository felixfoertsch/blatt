/**
 * Check whether a request is allowed to view draft pages.
 * Access is granted only if a preview token is configured and the query token matches.
 */
export function canViewDrafts(previewToken: string, queryToken: string): boolean {
	return previewToken.length > 0 && queryToken === previewToken;
}
