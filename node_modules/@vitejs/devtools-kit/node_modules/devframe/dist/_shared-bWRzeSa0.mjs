import { cleanDoubleSlashes, withLeadingSlash, withTrailingSlash } from "ufo";
//#region src/adapters/_shared.ts
/**
* Resolve the mount base path for a devframe's SPA. Hosted adapters
* (`vite`, `embedded`) default to `/__<id>/` so they don't collide
* with the host app; standalone adapters (`cli`, `spa`, `build`)
* default to `/` because they own the origin.
*
* The devframe author can override with `basePath` on the definition.
*/
function resolveBasePath(def, kind) {
	if (def.basePath) return normalizeBasePath(def.basePath);
	return kind === "standalone" ? "/" : `/__${def.id}/`;
}
function normalizeBasePath(base) {
	return cleanDoubleSlashes(withTrailingSlash(withLeadingSlash(base)));
}
//#endregion
export { resolveBasePath as n, normalizeBasePath as t };
