import { t as DevToolsDocksUserSettings } from "./settings-DDLCGejq.js";
import { defineCommand, defineDockEntry } from "@devframes/hub";
import { ClientScriptEntry, ConnectionMeta, DevframeCapabilities, DevframeCapabilities as DevToolsCapabilities, DevframeChildProcessExecuteOptions as DevToolsChildProcessExecuteOptions, DevframeChildProcessTerminalSession as DevToolsChildProcessTerminalSession, DevframeClientCommand as DevToolsClientCommand, DevframeCommandBase as DevToolsCommandBase, DevframeCommandEntry as DevToolsCommandEntry, DevframeCommandHandle as DevToolsCommandHandle, DevframeCommandKeybinding as DevToolsCommandKeybinding, DevframeCommandShortcutOverrides as DevToolsCommandShortcutOverrides, DevframeCommandsHost as DevToolsCommandsHost, DevframeCommandsHostEvents as DevToolsCommandsHostEvents, DevframeDiagnosticsDefinition as DevToolsDiagnosticsDefinition, DevframeDiagnosticsHost as DevToolsDiagnosticsHost, DevframeDiagnosticsLogger as DevToolsDiagnosticsLogger, DevframeDockActivation as DevToolsDockActivation, DevframeDockEntriesGrouped as DevToolsDockEntriesGrouped, DevframeDockEntry as DevToolsDockEntry, DevframeDockEntryBase, DevframeDockEntryBase as DevToolsDockEntryBase, DevframeDockEntryCategory, DevframeDockEntryIcon as DevToolsDockEntryIcon, DevframeDockUserEntry as DevToolsDockUserEntry, DevframeDocksActiveState as DevToolsDocksActiveState, DevframeDocksHost as DevToolsDockHost, DevframeHost as DevToolsHost, DevframeMessageElementPosition as DevToolsMessageElementPosition, DevframeMessageEntry as DevToolsMessageEntry, DevframeMessageEntryFrom as DevToolsMessageEntryFrom, DevframeMessageEntryInput as DevToolsMessageEntryInput, DevframeMessageFilePosition as DevToolsMessageFilePosition, DevframeMessageHandle as DevToolsMessageHandle, DevframeMessageLevel as DevToolsMessageLevel, DevframeMessagesClient as DevToolsMessagesClient, DevframeMessagesHost as DevToolsMessagesHost, DevframeNodeRpcSession as DevToolsNodeRpcSession, DevframeRpcClientFunctions as DevToolsRpcClientFunctions, DevframeRpcServerFunctions as DevToolsRpcServerFunctions, DevframeRpcSharedStates as DevToolsRpcSharedStates, DevframeServerCommandEntry as DevToolsServerCommandEntry, DevframeServerCommandInput as DevToolsServerCommandInput, DevframeTerminalSession as DevToolsTerminalSession, DevframeTerminalSessionBase as DevToolsTerminalSessionBase, DevframeTerminalStatus as DevToolsTerminalStatus, DevframeTerminalsHost as DevToolsTerminalHost, DevframeViewAction as DevToolsViewAction, DevframeViewBuiltin as DevToolsViewBuiltin, DevframeViewCustomRender as DevToolsViewCustomRender, DevframeViewGroup as DevToolsViewGroup, DevframeViewHost as DevToolsViewHost, DevframeViewIframe as DevToolsViewIframe, DevframeViewLauncher, DevframeViewLauncherStatus as DevToolsViewLauncherStatus, EntriesToObject, EventEmitter, EventUnsubscribe, EventsMap, FrameSubTabsConfig as DevToolsFrameSubTabsConfig, NavTarget as DevToolsNavTarget, PartialWithoutId, RemoteConnectionInfo, RemoteDockOptions, RpcBroadcastOptions, RpcDefinitionsFilter, RpcDefinitionsToFunctions, RpcFunctionsHost, RpcSharedStateGetOptions, RpcSharedStateHost, RpcStreamingChannel, RpcStreamingChannelOptions, RpcStreamingHost, Thenable } from "@devframes/hub/types";
import { CreateHubContextOptions, DevframeHubContext } from "@devframes/hub/node";
import { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { DevframeJsonRenderSpec, JsonRenderView, JsonRenderViewRef, UIElement } from "@devframes/json-render";
import { DevframeNodeContext as DevToolsNodeContext } from "devframe/types";
//#region src/types/json-render.d.ts
/** A json-render spec — the declarative UI description a plugin authors. */
type JsonRenderSpec = DevframeJsonRenderSpec;
/** A single element within a spec's `elements` map. */
type JsonRenderElement = UIElement;
/**
 * The handle returned by `ctx.createJsonRenderer()`. It wraps a devframe
 * {@link JsonRenderView} (created via `@devframes/json-render`'s
 * `createJsonRenderView`) and exposes the kit's back-compat method names.
 *
 * Its methods are defined non-enumerably so the handle stays fully
 * serializable when carried on a `json-render` dock entry's `ui` field —
 * only the plain string metadata (`_stateKey`) crosses the wire to the
 * client, which subscribes through it.
 */
interface JsonRenderer {
  /** Replace the entire spec. */
  updateSpec: (spec: JsonRenderSpec) => void;
  /** Shallow-merge values into the view's `state`. */
  updateState: (state: Record<string, unknown>) => void;
  /** Unregister the underlying view's shared state and listeners. */
  dispose: () => void;
  /** Shared-state key the client subscribes to for the live spec + state. */
  readonly _stateKey: string;
  /** The serializable reference to the underlying view. */
  readonly view: JsonRenderViewRef;
}
//#endregion
//#region src/node/context.d.ts
/**
 * Kit-augmented node context — the framework-neutral hub context from
 * `@devframes/hub`, plus the Vite-specific slots surfaced when kit hosts
 * the devtool inside Vite DevTools, and the kit's `createJsonRenderer`
 * factory (json-render is the opt-in `@devframes/json-render` package, so
 * the kit — not the hub — surfaces it on the context).
 *
 * `Omit<DevframeHubContext, 'createJsonRenderer'>`: hub 0.7.9 re-added its own
 * `createJsonRenderer` as a **deprecated** back-compat factory (removed in
 * 0.8) typed against the hub's own pre-0.7 `JsonRenderSpec` (whose element
 * `props` is optional). The kit's factory is typed against
 * `@devframes/json-render`'s `Spec` (`props` required) instead — the
 * currently-recommended, non-deprecated surface — so the property must be
 * omitted from the base before it's redeclared here, or the narrower
 * parameter type makes this an invalid override.
 */
interface KitNodeContext extends Omit<DevframeHubContext, 'createJsonRenderer'> {
  readonly viteConfig?: ResolvedConfig;
  readonly viteServer?: ViteDevServer;
  /**
   * Create a json-render handle for building declarative, server-driven
   * panels. Register the returned handle on a `json-render` dock entry's `ui`
   * field and call `updateSpec` / `updateState` to drive it reactively.
   */
  createJsonRenderer: (spec: JsonRenderSpec) => JsonRenderer;
}
interface CreateKitContextOptions extends CreateHubContextOptions {
  /** Optional Vite resolved config to surface on the context (for Vite-mounted hubs). */
  viteConfig?: ResolvedConfig;
  /** Optional Vite dev server to surface on the context. */
  viteServer?: ViteDevServer;
}
//#endregion
//#region src/types/docks.d.ts
/**
 * A `json-render` dock entry. `@devframes/hub` ships no json-render variant of
 * its own (json-render is the opt-in `@devframes/json-render` package), so the
 * kit contributes this Vite-flavored entry to the hub's open dock union.
 *
 * It carries the {@link JsonRenderer} handle from `ctx.createJsonRenderer()` on
 * `ui`; the handle's methods are non-enumerable, so only its serializable
 * metadata survives dock projection into shared state, where the client reads
 * `ui._stateKey` to subscribe to the live spec.
 */
interface DevToolsViewJsonRender extends DevframeDockEntryBase {
  type: 'json-render';
  /** The renderer handle created by `ctx.createJsonRenderer()`. */
  ui: JsonRenderer;
}
declare module '@devframes/hub/types' {
  interface DevframeDockEntryRegistry {
    'json-render': DevToolsViewJsonRender;
  }
}
/**
 * A selectable launch root offered by a launcher dock entry.
 *
 * When a launcher supplies {@link DevToolsViewLauncher.launcher.roots}, the
 * viewer renders a picker above the launch button. The selected root's
 * {@link DevToolsLaunchRoot.value} is forwarded to the launch as `{ root }`,
 * where a `createProcessLauncher` uses it as the spawned process's `cwd`.
 */
interface DevToolsLaunchRoot {
  /** Absolute path forwarded as the spawn `cwd` when this root is selected. */
  value: string;
  /** Human-friendly label shown in the picker (e.g. `Workspace root`). */
  label: string;
  /** Optional secondary line, e.g. the path itself. */
  description?: string;
}
/**
 * Payload carried from the client launch action to the bound launch command.
 */
interface DevToolsLaunchPayload {
  /** The {@link DevToolsLaunchRoot.value} of the root the user selected. */
  root?: string;
}
/**
 * Kit augmentation of hub's launcher entry: adds optional selectable launch
 * {@link DevToolsViewLauncher.launcher.roots | roots}.
 *
 * Docks belong to `@devframes/hub`; this extends the upstream launcher shape
 * locally until the field lands there. Since `roots` is optional, a plain hub
 * `DevframeViewLauncher` remains assignable to this type.
 */
interface DevToolsViewLauncher extends DevframeViewLauncher {
  launcher: DevframeViewLauncher['launcher'] & {
    /**
     * Selectable launch roots, owner-populated via `docks.update()`. When
     * present the viewer renders a picker; the chosen root's `value` is
     * forwarded to the launch command as {@link DevToolsLaunchPayload}.
     */
    roots?: DevToolsLaunchRoot[];
  };
}
/**
 * The kit's dock-entry category union. Vite Plus integrations are collected
 * under a dedicated dock group (see `DEVTOOLS_VITEPLUS_GROUP_ID`) rather than
 * a category, so this mirrors hub's framework-neutral set directly.
 */
type DevToolsDockEntryCategory = DevframeDockEntryCategory;
//#endregion
//#region src/types/vite-plugin.d.ts
interface DevToolsPluginOptions {
  capabilities?: {
    dev?: DevframeCapabilities | boolean;
    build?: DevframeCapabilities | boolean;
  };
  setup: (context: ViteDevToolsNodeContext) => void | Promise<void>;
}
/**
 * Vite-extended node context — kit-augmented context with the four hub
 * subsystems (`docks`, `terminals`, `messages`, `commands`) plus the
 * Vite-specific slots (`viteConfig`, `viteServer`). Plugins running
 * under `@vitejs/devtools` rely on this surface; portable devframe
 * apps should target {@link KitNodeContext} or the framework-neutral
 * `DevframeNodeContext` from `devframe/types`.
 */
interface ViteDevToolsNodeContext extends KitNodeContext {
  readonly viteConfig: ResolvedConfig;
  readonly viteServer?: ViteDevServer;
}
//#endregion
//#region src/types/vite-augment.d.ts
declare module 'vite' {
  interface Plugin {
    devtools?: DevToolsPluginOptions;
  }
}
interface PluginWithDevTools extends Plugin {
  devtools?: DevToolsPluginOptions;
}
//#endregion
//#region src/define.d.ts
/**
 * Identity helper that types a json-render spec literal. `@devframes/hub` no
 * longer ships this (json-render moved to the opt-in `@devframes/json-render`
 * package, whose spec is a plain `@json-render/core` `Spec`), so the kit keeps
 * the convenience helper for authoring specs with inference.
 */
declare function defineJsonRenderSpec(spec: JsonRenderSpec): JsonRenderSpec;
declare const defineRpcFunction: <NAME extends string, TYPE extends import("devframe/rpc").RpcFunctionType, ARGS extends any[], RETURN = void, const AS extends import("devframe/rpc").RpcArgsSchema | undefined = undefined, const RS extends import("devframe/rpc").RpcReturnSchema | undefined = undefined>(definition: import("devframe/rpc").RpcFunctionDefinition<NAME, TYPE, ARGS, RETURN, AS, RS, ViteDevToolsNodeContext>) => import("devframe/rpc").RpcFunctionDefinition<NAME, TYPE, ARGS, RETURN, AS, RS, ViteDevToolsNodeContext>;
//#endregion
export { type ClientScriptEntry, type ConnectionMeta, type CreateKitContextOptions, type DevToolsCapabilities, type DevToolsChildProcessExecuteOptions, type DevToolsChildProcessTerminalSession, type DevToolsClientCommand, type DevToolsCommandBase, type DevToolsCommandEntry, type DevToolsCommandHandle, type DevToolsCommandKeybinding, type DevToolsCommandShortcutOverrides, type DevToolsCommandsHost, type DevToolsCommandsHostEvents, type DevToolsDiagnosticsDefinition, type DevToolsDiagnosticsHost, type DevToolsDiagnosticsLogger, type DevToolsDockActivation, type DevToolsDockEntriesGrouped, type DevToolsDockEntry, type DevToolsDockEntryBase, type DevToolsDockEntryCategory, type DevToolsDockEntryIcon, type DevToolsDockHost, type DevToolsDockUserEntry, type DevToolsDocksActiveState, type DevToolsDocksUserSettings, type DevToolsFrameSubTabsConfig, type DevToolsHost, type DevToolsLaunchPayload, type DevToolsLaunchRoot, type DevToolsMessageElementPosition, type DevToolsMessageEntry, type DevToolsMessageEntryFrom, type DevToolsMessageEntryInput, type DevToolsMessageFilePosition, type DevToolsMessageHandle, type DevToolsMessageLevel, type DevToolsMessagesClient, type DevToolsMessagesHost, type DevToolsNavTarget, type DevToolsNodeContext, type DevToolsNodeRpcSession, type DevToolsPluginOptions, type DevToolsRpcClientFunctions, type DevToolsRpcServerFunctions, type DevToolsRpcSharedStates, type DevToolsServerCommandEntry, type DevToolsServerCommandInput, type DevToolsTerminalHost, type DevToolsTerminalSession, type DevToolsTerminalSessionBase, type DevToolsTerminalStatus, type DevToolsViewAction, type DevToolsViewBuiltin, type DevToolsViewCustomRender, type DevToolsViewGroup, type DevToolsViewHost, type DevToolsViewIframe, type DevToolsViewJsonRender, type DevToolsViewLauncher, type DevToolsViewLauncherStatus, type EntriesToObject, type EventEmitter, type EventUnsubscribe, type EventsMap, type JsonRenderElement, type JsonRenderSpec, type JsonRenderView, type JsonRenderViewRef, type JsonRenderer, type KitNodeContext, type PartialWithoutId, type PluginWithDevTools, type RemoteConnectionInfo, type RemoteDockOptions, type RpcBroadcastOptions, type RpcDefinitionsFilter, type RpcDefinitionsToFunctions, type RpcFunctionsHost, type RpcSharedStateGetOptions, type RpcSharedStateHost, type RpcStreamingChannel, type RpcStreamingChannelOptions, type RpcStreamingHost, type Thenable, type ViteDevToolsNodeContext, defineCommand, defineDockEntry, defineJsonRenderSpec, defineRpcFunction };