import { At as DevframeAgentHostEvents, C as DevframeServicesHost, Ct as AgentResourceContent, Dt as AgentToolProvider, Et as AgentToolInput, H as DevframeDiagnosticsHost$1, J as RpcSharedStateHost, K as RpcFunctionsHost, L as DevframeViewHost$1, O as DevframeSettings, Ot as AgentToolProviderHandle, R as DevframeHost, S as DevframeServiceOf, St as AgentResource, T as DevframeScopedNodeContext, Tt as AgentTool, U as DevframeDiagnosticsLogger, Z as RpcStreamingHost, b as DevframeNodeContext, bt as AgentHandle, ht as SharedState, jt as EventEmitter, kt as DevframeAgentHost$1, wt as AgentResourceInput, x as DevframeServiceId, xt as AgentManifest } from "../devframe-mQ4qZAuo.mjs";
import { v as RpcFunctionDefinitionAny } from "../types-CnJSgRVa.mjs";
import "../index-Dbw1p5ch.mjs";
import { n as StartedServer, r as startHttpAndWs, t as StartHttpAndWsOptions } from "../server-UHWae43Q.mjs";
import { BirpcGroup } from "birpc";
//#region src/node/agent-args.d.ts
/**
 * How {@link coerceAgentPositionalArgs} treats an args object that carries
 * neither declared schemas nor `arg0`/`arg1`/… keys:
 *
 * - `'wrap'` — pass the object itself as the single positional argument.
 *   RPC-backed tools use this: an untyped RPC may take one raw object.
 * - `'drop'` — call with zero arguments. Command-backed tools use this:
 *   a handler's positional parameters come solely from its declared
 *   `agent.args` schemas, so undeclared payload is ignored.
 */
type AgentArgsFallback = 'wrap' | 'drop';
/**
 * Map the args payload an agent surface receives (MCP sends an object
 * keyed `arg0`/`arg1`/…, matching the schema the adapter advertises) onto
 * a handler's positional parameters. Shared by the agent host's RPC
 * bridge and the hub's command-derived tools so the coercion cannot
 * drift between them.
 *
 * - an array passes through as-is
 * - `null`/`undefined` become a zero-argument call
 * - with declared schemas, each schema reads its own `argN` key, in order
 * - without schemas, `arg0`/`arg1`/… keys are collected when present
 * - an empty object becomes a zero-argument call
 * - anything else follows the {@link AgentArgsFallback}
 *
 * @experimental
 */
declare function coerceAgentPositionalArgs(args: unknown, schemas: readonly unknown[] | undefined, fallback?: AgentArgsFallback): unknown[];
//#endregion
//#region src/node/context.d.ts
interface CreateHostContextOptions {
  cwd: string;
  workspaceRoot?: string;
  mode: 'dev' | 'build';
  host: DevframeHost;
  /**
   * Built-in RPC declarations to register on the host. Framework
   * adapters (vite, rolldown, cli) can pass the ones they need; the
   * host itself has no opinions about the built-in set.
   */
  builtinRpcDeclarations?: readonly RpcFunctionDefinitionAny[];
}
/**
 * Framework- and build-tool-agnostic core of the Devframe node context.
 * Wires the RPC host, view (HTTP file-serving) host, diagnostics, and
 * agent subsystems. Host adapters can wrap this to augment `ctx` with
 * extra surfaces — for example, `@vitejs/devtools-kit`'s
 * `createKitContext` attaches `docks`, `terminals`, `messages`, and
 * `commands` when mounted into Vite DevTools.
 */
declare function createHostContext(options: CreateHostContextOptions): Promise<DevframeNodeContext>;
//#endregion
//#region src/node/host-agent.d.ts
/**
 * Framework-neutral host aggregating the agent-exposed surface of a
 * devframe. Auto-discovers RPC functions with an `agent` field from
 * `ctx.rpc.definitions`, and accepts plugin-registered tools /
 * resources via `registerTool` / `registerResource`.
 *
 * @experimental
 */
declare class DevframeAgentHost implements DevframeAgentHost$1 {
  readonly context: DevframeNodeContext;
  readonly events: EventEmitter<DevframeAgentHostEvents>;
  private readonly tools;
  private readonly resources;
  private readonly providers;
  private _rpcUnsubscribe;
  constructor(context: DevframeNodeContext);
  registerTool(input: AgentToolInput): AgentHandle;
  unregisterTool(id: string): boolean;
  registerToolProvider(provider: AgentToolProvider): AgentToolProviderHandle;
  registerResource(input: AgentResourceInput): AgentHandle;
  unregisterResource(id: string): boolean;
  list(): AgentManifest;
  getTool(id: string): AgentTool | undefined;
  getResource(id: string): AgentResource | undefined;
  invoke(id: string, args: unknown): Promise<unknown>;
  read(id: string): Promise<AgentResourceContent>;
  /** @internal */
  _dispose(): void;
  private _validateToolId;
  private _projectTool;
  /** Query every registered provider, projecting inputs to serializable tools. */
  private _collectProviderTools;
  private _collectRpcTools;
  private _findRpcDefinition;
}
//#endregion
//#region src/node/host-diagnostics.d.ts
declare class DevframeDiagnosticsHost implements DevframeDiagnosticsHost$1 {
  readonly context: DevframeNodeContext;
  private _registry;
  readonly logger: DevframeDiagnosticsLogger;
  readonly defineDiagnostics: DevframeDiagnosticsHost$1['defineDiagnostics'];
  constructor(context: DevframeNodeContext, initialDefinitions?: Array<Record<string, unknown>>);
  register(diagnostics: Record<string, unknown>): void;
}
//#endregion
//#region src/node/host-h3.d.ts
interface CreateH3DevframeHostOptions {
  /** The h3 app instance — registered once the CLI adapter lands. */
  app?: unknown;
  /**
   * Host the standalone server listens on, e.g. `http://localhost:9999`.
   * Consumed by `resolveOrigin` for dock entries that need an absolute URL.
   */
  origin: string;
  /**
   * Register a static-file handler at `base` serving files from `distDir`.
   * Wired into the h3 app once the CLI adapter lands (commit 5). For now
   * the CLI isn't running, so the default is a no-op.
   */
  mount?: (base: string, distDir: string) => void | Promise<void>;
  /**
   * Namespace for storage paths returned by `getStorageDir`. Workspace
   * state (committable) lives under `${workspaceRoot}/.devframe/`, project
   * state under `${workspaceRoot}/node_modules/.<appName>/devframe/`, and
   * global state under `${homedir()}/.<appName>/devframe/`. Pick the
   * devtool's id (or another stable, filesystem-safe identifier) so the
   * standalone host doesn't collide with other tools' storage.
   */
  appName: string;
  /**
   * Workspace root used as the parent of the per-project storage
   * directory. Defaults to `process.cwd()`.
   */
  workspaceRoot?: string;
}
/**
 * h3-backed {@link DevframeHost} — used by the standalone CLI adapter.
 */
declare function createH3DevframeHost(options: CreateH3DevframeHostOptions): DevframeHost;
//#endregion
//#region src/node/host-services.d.ts
/**
 * Cross-plugin service registry (see `types/services.ts` for the contract).
 * Values are held per context instance; `whenAvailable` subscriptions make
 * the mechanism robust against setup ordering between provider and consumer.
 */
declare class DevframeServicesHostImpl implements DevframeServicesHost {
  private services;
  private listeners;
  provide<ID extends DevframeServiceId>(id: ID, service: DevframeServiceOf<ID>): () => void;
  get<ID extends DevframeServiceId>(id: ID): DevframeServiceOf<ID> | undefined;
  has(id: DevframeServiceId): boolean;
  whenAvailable<ID extends DevframeServiceId>(id: ID, callback: (service: DevframeServiceOf<ID>) => void): () => void;
  keys(): string[];
}
//#endregion
//#region src/node/host-views.d.ts
declare class DevframeViewHost implements DevframeViewHost$1 {
  readonly context: DevframeNodeContext;
  /**
   * @internal
   */
  buildStaticDirs: {
    baseUrl: string;
    distDir: string;
  }[];
  constructor(context: DevframeNodeContext);
  hostStatic(baseUrl: string, distDir: string): void;
}
//#endregion
//#region src/node/instance-registry.d.ts
/**
 * One running devframe instance, as recorded in the instance registry.
 * Records are self-describing JSON — additive fields are safe.
 *
 * @experimental The agent-native surface is experimental and may change
 * without a major version bump until it stabilizes.
 */
interface DevframeInstanceRecord {
  /** Process id of the dev server. */
  pid: number;
  /** Listening port. */
  port: number;
  /** Dialable HTTP origin, e.g. `http://127.0.0.1:9876`. */
  origin: string;
  /** Base path the devframe is mounted at (trailing slash). */
  basePath: string;
  /** Definition id. */
  id: string;
  /** Definition display name. */
  name?: string;
  /** Working directory the instance was started from. */
  rootDir: string;
  /**
   * Absolute URL path of the MCP Streamable-HTTP endpoint on `origin`, or
   * `null` when the instance runs without an MCP route.
   */
  mcp: {
    path: string;
  } | null;
  /** Epoch-ms timestamp of registration. */
  startedAt: number;
}
/**
 * Handle returned by {@link registerDevframeInstance}.
 *
 * @experimental
 */
interface DevframeInstanceRegistration {
  /** The registry file backing this registration. */
  readonly file: string;
  /** Remove the record (idempotent). Call on server close. */
  unregister: () => void;
}
/**
 * Record a running devframe instance in the global instance registry so
 * discovery tooling (`devframe connect`, editor integrations) can find it
 * without port guessing.
 *
 * `createDevServer` registers automatically; custom hosts that serve a
 * devframe in-process (e.g. `@devframes/next`'s host inside a Next dev
 * server) call this explicitly with the origin they are reachable at.
 *
 * The record is written atomically to `<dir>/<pid>-<port>.json` and removed
 * by {@link DevframeInstanceRegistration.unregister}. Records surviving a
 * crash are pruned by readers whose liveness probe fails. Registration never
 * throws — a write failure degrades to a coded warning (`DF0045`), since a
 * dev server must not die over discovery metadata.
 *
 * @experimental
 */
declare function registerDevframeInstance(record: DevframeInstanceRecord, options?: {
  instancesDir?: string;
}): DevframeInstanceRegistration;
/**
 * Read the registry and split records into live and dead by probing each
 * one's `__connection.json`, deleting dead records (prune-on-read). Live
 * records carry the dialable origin the probe confirmed (a `localhost`
 * record may come back as `127.0.0.1` / `[::1]`).
 *
 * A liveness probe only proves *something* answers on the record's port, so
 * records left behind by killed processes shadow the server currently bound
 * there: per `(port, basePath)` only the newest record survives, older
 * ghosts are pruned with the dead.
 *
 * @experimental
 */
declare function listLiveDevframeInstances(options?: {
  instancesDir?: string;
  timeoutMs?: number;
}): Promise<{
  live: DevframeInstanceRecord[];
  pruned: DevframeInstanceRecord[];
}>;
//#endregion
//#region src/node/rpc-shared-state.d.ts
declare function createRpcSharedStateServerHost(rpc: RpcFunctionsHost): RpcSharedStateHost;
//#endregion
//#region src/node/rpc-streaming.d.ts
/**
 * Build the server-side streaming host. Mirrors the layout of
 * `createRpcSharedStateServerHost` — registers a fixed set of internal
 * RPC methods (`subscribe` / `unsubscribe` / `cancel`) once, then per-channel
 * state lives in a `Map<channelName, ChannelState>`.
 */
declare function createRpcStreamingServerHost(rpc: RpcFunctionsHost): RpcStreamingHost;
//#endregion
//#region src/node/scope.d.ts
/**
 * Build a namespace-scoped view of a {@link DevframeNodeContext}. Every
 * RPC id, shared-state key, and streaming channel passed through the
 * returned `rpc` surface is auto-namespaced with `<namespace>:`.
 */
declare function createScopedNodeContext<NS extends string = string>(context: DevframeNodeContext, namespace: NS): DevframeScopedNodeContext<NS>;
//#endregion
//#region src/node/settings.d.ts
/**
 * Build the node-side `settings` surface for a scope namespace. `project`
 * persists under the host's `workspace` storage dir, `global` under its
 * `global` dir. Each is a file-backed, client-synced key-value store.
 */
declare function createNodeSettings<T extends Record<string, any> = Record<string, any>>(context: DevframeNodeContext, namespace: string): DevframeSettings<T>;
//#endregion
//#region src/node/storage.d.ts
interface CreateStorageOptions<T extends object> {
  filepath: string;
  initialValue: T;
  mergeInitialValue?: false | ((initialValue: T, savedValue: T) => T);
  debounce?: number;
}
declare function createStorage<T extends object>(options: CreateStorageOptions<T>): SharedState<T>;
//#endregion
//#region src/node/utils.d.ts
declare function isObject(value: unknown): value is Record<string, any>;
/** Map a bind host to a host a client can actually connect to. */
declare function toDialableHost(host: string): string;
/** Format a bind host for use in a URL authority (dialable, IPv6-bracketed). */
declare function formatHostForUrl(host: string): string;
declare function normalizeHttpServerUrl(host: string, port: number | string): string;
//#endregion
export { AgentArgsFallback, CreateH3DevframeHostOptions, CreateHostContextOptions, CreateStorageOptions, DevframeAgentHost, DevframeDiagnosticsHost, type DevframeInstanceRecord, type DevframeInstanceRegistration, DevframeServicesHostImpl, DevframeViewHost, type RpcFunctionsHost, StartHttpAndWsOptions, StartedServer, coerceAgentPositionalArgs, createH3DevframeHost, createHostContext, createNodeSettings, createRpcSharedStateServerHost, createRpcStreamingServerHost, createScopedNodeContext, createStorage, formatHostForUrl, isObject, listLiveDevframeInstances, normalizeHttpServerUrl, registerDevframeInstance, startHttpAndWs, toDialableHost };