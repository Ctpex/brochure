import { createDefineWrapperWithContext } from "devframe/rpc";
//#region src/define.ts
const defineHubRpcFunction = createDefineWrapperWithContext();
function defineCommand(command) {
	return command;
}
function defineDockEntry(entry) {
	return entry;
}
/**
* @deprecated json-render moved out of the hub into the opt-in
* `@devframes/json-render` integration in 0.7. This identity helper is kept
* so existing imports keep compiling — pass your spec directly to
* `createJsonRenderView` (from `@devframes/json-render/node`) instead.
* Removed in 0.8.
*/
function defineJsonRenderSpec(spec) {
	return spec;
}
//#endregion
export { defineJsonRenderSpec as i, defineDockEntry as n, defineHubRpcFunction as r, defineCommand as t };
