//#region src/utils/scope.d.ts
/** Whether a name is already namespaced (contains a `:` separator). */
declare function isQualifiedName(name: string): boolean;
/**
 * Prefix a bare name with `<namespace>:`. Names that already contain a
 * `:` are returned unchanged, so callers can reference another scope's
 * ids explicitly (e.g. `ctx.rpc.call('other-plugin:fn')`).
 */
declare function qualifyName(namespace: string, name: string): string;
//#endregion
export { isQualifiedName, qualifyName };