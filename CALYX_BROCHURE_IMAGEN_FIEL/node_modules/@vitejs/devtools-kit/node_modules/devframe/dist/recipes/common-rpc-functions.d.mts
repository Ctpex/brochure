import "../devframe-mQ4qZAuo.mjs";
import { E as Thenable, S as RpcFunctionSetupResult, c as RpcDump, g as RpcFunctionAgentOptions } from "../types-CnJSgRVa.mjs";
import "../index-Dbw1p5ch.mjs";
import { t as SimpleSchema } from "../simple-schema-BDzLeJDk.mjs";
//#region src/recipes/common-rpc-functions.d.ts
/**
 * Editor commands that `launch-editor` (the library behind
 * `devframe/utils/launch-editor`) recognizes with a tailored
 * `file:line:column` invocation. `openInEditor`'s optional second argument
 * is restricted to this union, so the RPC surface can't be used to spawn an
 * arbitrary command.
 */
type KnownEditor = 'atom' | 'subl' | 'sublime' | 'sublime_text' | 'wstorm' | 'charm' | 'zed' | 'notepad++' | 'vim' | 'mvim' | 'joe' | 'gvim' | 'emacs' | 'emacsclient' | 'rmate' | 'mate' | 'code' | 'code-insiders' | 'codium' | 'vscodium' | 'trae' | 'antigravity' | 'cursor' | 'appcode' | 'clion' | 'idea' | 'phpstorm' | 'pycharm' | 'rubymine' | 'webstorm' | 'goland' | 'rider';
/** Runtime list of every {@link KnownEditor}. */
declare const KNOWN_EDITORS: KnownEditor[];
/**
 * Prebuilt RPC action that opens a file in the user's configured editor.
 *
 * Registered name: `devframe:open-in-editor`.
 *
 * The optional second argument picks the editor command explicitly (must be
 * one of {@link KNOWN_EDITORS}); otherwise it's auto-detected per
 * `devframe/utils/launch-editor`.
 *
 * ```ts
 * import { openInEditor } from 'devframe/recipes/common-rpc-functions'
 *
 * defineDevframe({
 *   id: 'my-tool',
 *   name: 'My Tool',
 *   setup(ctx) {
 *     ctx.rpc.register(openInEditor)
 *   },
 * })
 * ```
 */
declare const openInEditor: {
  name: "devframe:open-in-editor";
  type?: "action" | undefined;
  cacheable?: boolean;
  args: readonly [SimpleSchema<string, string>, SimpleSchema<KnownEditor | undefined, KnownEditor | undefined>];
  returns: SimpleSchema<void, void>;
  jsonSerializable?: boolean;
  agent?: RpcFunctionAgentOptions;
  setup?: ((context: undefined) => Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>>) | undefined;
  handler?: ((args_0: string, args_1: KnownEditor | undefined) => Thenable<void>) | undefined;
  dump?: RpcDump<[string, KnownEditor | undefined], Thenable<void>, undefined> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>>> | undefined;
  __promise?: Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>> | undefined;
};
/**
 * Prebuilt RPC action that reveals a path in the OS file explorer.
 *
 * Registered name: `devframe:open-in-finder`.
 *
 * ```ts
 * import { openInFinder } from 'devframe/recipes/common-rpc-functions'
 *
 * ctx.rpc.register(openInFinder)
 * ```
 */
declare const openInFinder: {
  name: "devframe:open-in-finder";
  type?: "action" | undefined;
  cacheable?: boolean;
  args: readonly [SimpleSchema<string, string>];
  returns: SimpleSchema<void, void>;
  jsonSerializable?: boolean;
  agent?: RpcFunctionAgentOptions;
  setup?: ((context: undefined) => Thenable<RpcFunctionSetupResult<[string], Thenable<void>>>) | undefined;
  handler?: ((args_0: string) => Thenable<void>) | undefined;
  dump?: RpcDump<[string], Thenable<void>, undefined> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, Thenable<RpcFunctionSetupResult<[string], Thenable<void>>>> | undefined;
  __promise?: Thenable<RpcFunctionSetupResult<[string], Thenable<void>>> | undefined;
};
/**
 * Convenience array bundling both helpers so callers can register them
 * in a single `forEach`.
 *
 * ```ts
 * import { commonRpcFunctions } from 'devframe/recipes/common-rpc-functions'
 *
 * commonRpcFunctions.forEach(fn => ctx.rpc.register(fn))
 * ```
 */
declare const commonRpcFunctions: readonly [{
  name: "devframe:open-in-editor";
  type?: "action" | undefined;
  cacheable?: boolean;
  args: readonly [SimpleSchema<string, string>, SimpleSchema<KnownEditor | undefined, KnownEditor | undefined>];
  returns: SimpleSchema<void, void>;
  jsonSerializable?: boolean;
  agent?: RpcFunctionAgentOptions;
  setup?: ((context: undefined) => Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>>) | undefined;
  handler?: ((args_0: string, args_1: KnownEditor | undefined) => Thenable<void>) | undefined;
  dump?: RpcDump<[string, KnownEditor | undefined], Thenable<void>, undefined> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>>> | undefined;
  __promise?: Thenable<RpcFunctionSetupResult<[string, KnownEditor | undefined], Thenable<void>>> | undefined;
}, {
  name: "devframe:open-in-finder";
  type?: "action" | undefined;
  cacheable?: boolean;
  args: readonly [SimpleSchema<string, string>];
  returns: SimpleSchema<void, void>;
  jsonSerializable?: boolean;
  agent?: RpcFunctionAgentOptions;
  setup?: ((context: undefined) => Thenable<RpcFunctionSetupResult<[string], Thenable<void>>>) | undefined;
  handler?: ((args_0: string) => Thenable<void>) | undefined;
  dump?: RpcDump<[string], Thenable<void>, undefined> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, Thenable<RpcFunctionSetupResult<[string], Thenable<void>>>> | undefined;
  __promise?: Thenable<RpcFunctionSetupResult<[string], Thenable<void>>> | undefined;
}];
//#endregion
export { KNOWN_EDITORS, KnownEditor, commonRpcFunctions, openInEditor, openInFinder };