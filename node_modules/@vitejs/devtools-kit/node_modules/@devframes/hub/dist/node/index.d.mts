import { C as DevframeDocksHost$1, O as DevframeViewIframe, d as DevframeServerCommandEntry, f as DevframeServerCommandInput, g as DevframeDockEntry, l as DevframeCommandsHost$1, o as DevframeCommandHandle, p as ClientScriptEntry, t as DevframeDocksUserSettings, x as DevframeDockUserEntry } from "../settings-Byh48aCd.mjs";
import { DEFAULT_CATEGORIES_ORDER } from "../constants.mjs";
import { C as DevframeMessageShortcutInput, D as DevframeMessagesListDelta, T as DevframeMessagesHost$1, _ as DevframeMessageEntry, c as DevframePtyExecuteOptions, d as DevframeTerminalSessionBase, i as DevframeChildProcessExecuteOptions, l as DevframePtyTerminalSession, n as DevframeHubContext, p as DevframeTerminalsHost$1, r as createHubContext, s as DevframeChildProcessTerminalSession, t as CreateHubContextOptions, u as DevframeTerminalSession, x as DevframeMessageHandle, y as DevframeMessageEntryInput } from "../context-BSgzLnsu.mjs";
import { RpcFunctionDefinitionAny } from "devframe/rpc";
import { DevframeDefinition } from "devframe/types";
import { SharedState } from "devframe/utils/shared-state";
//#region src/node/host-commands.d.ts
declare class DevframeCommandsHost implements DevframeCommandsHost$1 {
  readonly context: DevframeHubContext;
  readonly commands: DevframeCommandsHost$1['commands'];
  readonly events: DevframeCommandsHost$1['events'];
  /**
   * Lazy agent projection: `ctx.agent` queries this provider at list/invoke
   * time, deriving tools from {@link commands} on demand — the commands map
   * stays the single source of truth, nothing is mirrored or kept in sync.
   */
  private readonly agentProvider;
  constructor(context: DevframeHubContext);
  register(command: DevframeServerCommandInput): DevframeCommandHandle;
  unregister(id: string): boolean;
  execute(id: string, ...args: any[]): Promise<unknown>;
  list(): DevframeServerCommandEntry[];
  private findCommand;
  private toSerializable;
  /** Reject `agent` on handler-less commands anywhere in the tree, up front. */
  private validateAgentExposure;
  /**
   * Derive the agent-tool projection of the current command trees: every
   * agent-flagged, handler-bearing command (children included) becomes a
   * callable tool. Queried lazily by the provider registered in the
   * constructor. `when` clauses evaluate client-side only and are not
   * enforced here — opting in a `when`-gated command is a deliberate author
   * decision (documented on `DevframeCommandAgentOptions`).
   */
  private collectAgentTools;
}
//#endregion
//#region src/node/host-docks.d.ts
declare class DevframeDocksHost implements DevframeDocksHost$1 {
  readonly context: DevframeHubContext;
  readonly views: DevframeDocksHost$1['views'];
  readonly events: DevframeDocksHost$1['events'];
  userSettings: SharedState<DevframeDocksUserSettings>;
  /** Dock-id → allocated remote token + resolved options. */
  private readonly remoteDocks;
  constructor(context: DevframeHubContext);
  init(): Promise<void>;
  values(): DevframeDockEntry[];
  private projectView;
  private resolveDevServerOrigin;
  register<T extends DevframeDockUserEntry>(view: T, force?: boolean): {
    update: (patch: Partial<T>) => void;
  };
  update(view: DevframeDockUserEntry): void;
  activate(dockId: string, params?: Record<string, unknown>): void;
  private validateGroupMembership;
  private prepareRemoteRegistration;
}
//#endregion
//#region src/node/host-messages.d.ts
declare class DevframeMessagesHost implements DevframeMessagesHost$1 {
  readonly context: DevframeHubContext;
  readonly entries: DevframeMessagesHost$1['entries'];
  readonly events: DevframeMessagesHost$1['events'];
  /** Tracks when each entry was last added or updated (monotonic) */
  readonly lastModified: Map<string, number>;
  /** Tracks recently removed entry IDs with their removal time */
  readonly removals: Array<{
    id: string;
    time: number;
  }>;
  private _autoDeleteTimers;
  private _clock;
  /**
   * The tick of the newest removal record dropped from the capped
   * `removals` log — cursors older than this can't get a reliable delta
   * and fall back to a full snapshot in {@link listSince}.
   */
  private _removalsTrimmedAt;
  private _tick;
  private _recordRemoval;
  constructor(context: DevframeHubContext);
  add(input: DevframeMessageEntryInput): Promise<DevframeMessageHandle>;
  update(id: string, patch: Partial<DevframeMessageEntryInput>): Promise<DevframeMessageEntry | undefined>;
  remove(id: string): Promise<void>;
  info(message: string, extra?: DevframeMessageShortcutInput): Promise<DevframeMessageHandle>;
  warn(message: string, extra?: DevframeMessageShortcutInput): Promise<DevframeMessageHandle>;
  error(message: string, extra?: DevframeMessageShortcutInput): Promise<DevframeMessageHandle>;
  success(message: string, extra?: DevframeMessageShortcutInput): Promise<DevframeMessageHandle>;
  debug(message: string, extra?: DevframeMessageShortcutInput): Promise<DevframeMessageHandle>;
  clear(): Promise<void>;
  listSince(since?: number | null): DevframeMessagesListDelta;
  private _createHandle;
}
//#endregion
//#region src/node/host-terminals.d.ts
type PartialWithoutId<T extends {
  id: string;
}> = Partial<T> & {
  id: string;
};
declare class DevframeTerminalsHost implements DevframeTerminalsHost$1 {
  readonly context: DevframeHubContext;
  readonly sessions: DevframeTerminalsHost$1['sessions'];
  readonly events: DevframeTerminalsHost$1['events'];
  private _boundStreams;
  private _channel?;
  constructor(context: DevframeHubContext);
  /**
   * Lazily acquire the streaming channel — `context.rpc` isn't assigned
   * until after every host is constructed, so we can't grab it in the
   * constructor.
   */
  private getStreamingChannel;
  register(session: DevframeTerminalSession): DevframeTerminalSession;
  update(patch: PartialWithoutId<DevframeTerminalSession>): void;
  remove(session: DevframeTerminalSession): void;
  private bindStream;
  startChildProcess(executeOptions: DevframeChildProcessExecuteOptions, terminal: Omit<DevframeTerminalSessionBase, 'status'>): Promise<DevframeChildProcessTerminalSession>;
  startPtySession(executeOptions: DevframePtyExecuteOptions, terminal: Omit<DevframeTerminalSessionBase, 'status'>): Promise<DevframePtyTerminalSession>;
}
//#endregion
//#region src/node/mount-devframe.d.ts
interface MountDevframeOptions {
  /**
   * Mount path override. Defaults to `d.basePath` or `/__${d.id}/`.
   */
  base?: string;
  /**
   * Per-mount overrides for the auto-synthesized iframe dock entry. Use
   * this to customize the entry's `category`, override the icon, hide it
   * via `when` (or only its dock-bar button via `visibility`), etc. Takes
   * precedence over the definition's own {@link DevframeDefinition.dock}
   * defaults. Cannot change `id`, `type`, or `url` — those are derived from
   * the devframe definition.
   */
  dock?: Partial<Omit<DevframeViewIframe, 'id' | 'type' | 'url'>>;
}
/**
 * Framework-neutral primitive — mounts a {@link DevframeDefinition} as a
 * dock inside a hub-aware context: serves the devframe's SPA at the
 * resolved base path, synthesizes an iframe dock entry from the
 * definition's metadata, and runs the definition's `setup(ctx)`.
 *
 * Framework kits wrap this with their own plugin/middleware machinery —
 * e.g. `@vitejs/devtools-kit`'s `createPluginFromDevframe` returns a
 * Vite `Plugin` whose `devtools.setup` ultimately delegates here.
 */
declare function mountDevframe(ctx: DevframeHubContext, d: DevframeDefinition, options?: MountDevframeOptions): Promise<void>;
//#endregion
//#region src/node/rpc-builtins.d.ts
/**
 * `hub:commands:execute` — Invoke a registered server command by id. The
 * arguments after `id` are forwarded to the command's `handler(...)`.
 * Returns whatever the handler returns.
 *
 * Pairs with the `devframe:commands` shared state: clients read the list
 * from the shared state and dispatch by id via this RPC.
 */
declare const hubCommandsExecute: {
  name: "hub:commands:execute";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, ...args: any[]], Promise<unknown>>>) | undefined;
  handler?: ((id: string, ...args: any[]) => Promise<unknown>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string, ...args: any[]], Promise<unknown>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, ...args: any[]], Promise<unknown>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, ...args: any[]], Promise<unknown>>> | undefined;
};
/**
 * `hub:messages:add` — Add a message from a browser client into the hub's
 * messages subsystem. Marked `from: 'browser'`. Returns the serializable
 * entry (the mutation handle stays server-side).
 *
 * Pairs with the client-side {@link import('../client').createDevframeClientHost}
 * context, whose `messages` client dispatches through these built-ins so a
 * dock client script can report into the same feed the server writes to.
 */
declare const hubMessagesAdd: {
  name: "hub:messages:add";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: DevframeMessageEntryInput], Promise<DevframeMessageEntry>>>) | undefined;
  handler?: ((input: DevframeMessageEntryInput) => Promise<DevframeMessageEntry>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[input: DevframeMessageEntryInput], Promise<DevframeMessageEntry>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: DevframeMessageEntryInput], Promise<DevframeMessageEntry>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: DevframeMessageEntryInput], Promise<DevframeMessageEntry>>> | undefined;
};
/** `hub:messages:update` — Patch a message by id; returns the updated entry (or `undefined`). */
declare const hubMessagesUpdate: {
  name: "hub:messages:update";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, patch: Partial<DevframeMessageEntryInput>], Promise<DevframeMessageEntry | undefined>>>) | undefined;
  handler?: ((id: string, patch: Partial<DevframeMessageEntryInput>) => Promise<DevframeMessageEntry | undefined>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string, patch: Partial<DevframeMessageEntryInput>], Promise<DevframeMessageEntry | undefined>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, patch: Partial<DevframeMessageEntryInput>], Promise<DevframeMessageEntry | undefined>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, patch: Partial<DevframeMessageEntryInput>], Promise<DevframeMessageEntry | undefined>>> | undefined;
};
/** `hub:messages:remove` — Remove a message by id. */
declare const hubMessagesRemove: {
  name: "hub:messages:remove";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>) | undefined;
  handler?: ((id: string) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>> | undefined;
};
/** `hub:messages:clear` — Remove every message. */
declare const hubMessagesClear: {
  name: "hub:messages:clear";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[], Promise<void>>>) | undefined;
  handler?: (() => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[], Promise<void>>> | undefined;
};
/**
 * `hub:terminals:write` — Send input to an interactive PTY session spawned
 * via `ctx.terminals.startPtySession`. Lets a hub-aware terminal UI (e.g. the
 * terminals plugin) drive a session owned by another plugin.
 */
declare const hubTerminalsWrite: {
  name: "hub:terminals:write";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, data: string], Promise<void>>>) | undefined;
  handler?: ((id: string, data: string) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string, data: string], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, data: string], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, data: string], Promise<void>>> | undefined;
};
/** `hub:terminals:resize` — Resize an interactive PTY session by id. */
declare const hubTerminalsResize: {
  name: "hub:terminals:resize";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, cols: number, rows: number], Promise<void>>>) | undefined;
  handler?: ((id: string, cols: number, rows: number) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string, cols: number, rows: number], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, cols: number, rows: number], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string, cols: number, rows: number], Promise<void>>> | undefined;
};
/**
 * `hub:terminals:terminate` — Kill a session's process while keeping the
 * session registered (its output/scrollback stays). Works for both read-only
 * child-process and interactive PTY sessions, letting a hub-aware terminal UI
 * force-kill a session owned by another plugin.
 */
declare const hubTerminalsTerminate: {
  name: "hub:terminals:terminate";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>) | undefined;
  handler?: ((id: string) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>> | undefined;
};
/**
 * `hub:terminals:restart` — Re-run a session's command in place. Rejected for
 * sessions registered with `restartable: false`, whose lifecycle is owned
 * elsewhere.
 */
declare const hubTerminalsRestart: {
  name: "hub:terminals:restart";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>) | undefined;
  handler?: ((id: string) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>> | undefined;
};
/**
 * `hub:terminals:remove` — Kill a session's process (when it still owns one)
 * and drop it from the registry, disposing its output stream. Lets a hub-aware
 * terminal UI discard a stopped aggregated session.
 */
declare const hubTerminalsRemove: {
  name: "hub:terminals:remove";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>) | undefined;
  handler?: ((id: string) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[id: string], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[id: string], Promise<void>>> | undefined;
};
/**
 * `hub:docks:activate` — Ask the active viewer to switch its focused dock to
 * `dockId`, optionally carrying `params` for the target dock to interpret
 * (e.g. `{ sessionId }` for the terminals dock to focus a session).
 *
 * Any connected client may call it, which is the point: a mounted devframe
 * running in its own iframe (on its own RPC client) can steer the host shell's
 * dock selection — client-local state it otherwise can't reach. The hub
 * broadcasts the request live to connected clients (the host shell switches)
 * and mirrors it into the `devframe:docks:active` shared state (a dock that
 * mounts in response still converges on it).
 */
declare const hubDocksActivate: {
  name: "hub:docks:activate";
  type?: "action" | undefined;
  cacheable?: boolean;
  args?: undefined;
  returns?: undefined;
  jsonSerializable?: boolean;
  agent?: import("devframe").RpcFunctionAgentOptions;
  setup?: ((context: DevframeHubContext) => import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: {
    dockId: string;
    params?: Record<string, unknown>;
  }], Promise<void>>>) | undefined;
  handler?: ((input: {
    dockId: string;
    params?: Record<string, unknown>;
  }) => Promise<void>) | undefined;
  dump?: import("devframe/rpc").RpcDump<[input: {
    dockId: string;
    params?: Record<string, unknown>;
  }], Promise<void>, DevframeHubContext> | undefined;
  snapshot?: boolean;
  __cache?: WeakMap<object, import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: {
    dockId: string;
    params?: Record<string, unknown>;
  }], Promise<void>>>> | undefined;
  __promise?: import("devframe/rpc").Thenable<import("devframe/rpc").RpcFunctionSetupResult<[input: {
    dockId: string;
    params?: Record<string, unknown>;
  }], Promise<void>>> | undefined;
};
/**
 * Framework-neutral RPC declarations auto-registered by
 * {@link createHubContext}. Provide additional RPCs by passing your own
 * array via `CreateHubContextOptions.builtinRpcDeclarations`; the hub's
 * list is prepended automatically.
 */
declare const builtinHubRpcDeclarations: readonly RpcFunctionDefinitionAny[];
//#endregion
//#region src/node/utils.d.ts
/**
 * Create a quick `ClientScriptEntry` from an inline function or
 * stringified code. Useful for prototyping `action` / `renderer`
 * dock entries without setting up a separate importable module.
 *
 * @experimental Prefer a proper importable module for production use.
 */
declare function createSimpleClientScript(fn: string | ((ctx: any) => void)): ClientScriptEntry;
//#endregion
export { CreateHubContextOptions, DEFAULT_CATEGORIES_ORDER, DevframeCommandsHost, DevframeDocksHost, DevframeHubContext, DevframeMessagesHost, DevframeTerminalsHost, MountDevframeOptions, builtinHubRpcDeclarations, createHubContext, createSimpleClientScript, hubCommandsExecute, hubDocksActivate, hubMessagesAdd, hubMessagesClear, hubMessagesRemove, hubMessagesUpdate, hubTerminalsRemove, hubTerminalsResize, hubTerminalsRestart, hubTerminalsTerminate, hubTerminalsWrite, mountDevframe };