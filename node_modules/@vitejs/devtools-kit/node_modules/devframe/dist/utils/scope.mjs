//#region src/utils/scope.ts
/** Whether a name is already namespaced (contains a `:` separator). */
function isQualifiedName(name) {
	return name.includes(":");
}
/**
* Prefix a bare name with `<namespace>:`. Names that already contain a
* `:` are returned unchanged, so callers can reference another scope's
* ids explicitly (e.g. `ctx.rpc.call('other-plugin:fn')`).
*/
function qualifyName(namespace, name) {
	return isQualifiedName(name) ? name : `${namespace}:${name}`;
}
//#endregion
export { isQualifiedName, qualifyName };
