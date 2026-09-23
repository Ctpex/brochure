import { N as NavTarget, O as DevframeViewIframe, P as RemoteConnectionInfo, a as DevframeCommandEntry, g as DevframeDockEntry, h as DevframeDockEntriesGrouped, n as DevframeClientCommand, s as DevframeCommandKeybinding, t as DevframeDocksUserSettings, x as DevframeDockUserEntry, y as DevframeDockEntryIcon } from "../settings-Byh48aCd.mjs";
import { DEFAULT_CATEGORIES_ORDER } from "../constants.mjs";
import { w as DevframeMessagesClient, y as DevframeMessageEntryInput } from "../context-BSgzLnsu.mjs";
import "../index-IzywMKfP.mjs";
import { DevframeClientRpcHost, DevframeConnection, DevframeConnectionStatus, DevframeRpcClient, DevframeRpcClientOptions, DevframeRpcContext, RpcClientEvents, RpcClientEvents as RpcClientEvents$1 } from "devframe/client";
import { EventEmitter } from "devframe/types";
import { SharedState } from "devframe/utils/shared-state";
import { WhenContext } from "devframe/utils/when";
export * from "devframe/client";
//#region src/client/renderers.d.ts
/**
 * Options handed to a dock renderer when the client host mounts a dock entry.
 */
interface DockRendererMountOptions {
  /** The dock entry being rendered (carries the entry's serializable payload). */
  entry: DevframeDockEntry;
  /** The DOM element the renderer should mount into. */
  container: HTMLElement;
  /** The assembled client host context (rpc, docks, commands, …). */
  context: DevframeClientContext;
}
/** A mounted renderer instance the host can tear down. */
interface DockRendererInstance {
  /** Tear down the mounted UI and release its subscriptions. */
  dispose?: () => void;
}
/**
 * A renderer for a dock `type`. The headless hub is renderer-agnostic — a
 * host application registers renderers at boot (e.g. injecting
 * `@devframes/json-render-ui` for the `'json-render'` type). The renderer
 * owns its framework (Vue, React, …); the hub only routes a dock type to it
 * and disposes it on deactivation.
 */
type DockRenderer = (options: DockRendererMountOptions) => DockRendererInstance | Promise<DockRendererInstance>;
/**
 * The dock-renderer registry surfaced on the client host context. A viewer
 * calls {@link DockRenderersContext.mount} to render a dock whose `type` has a
 * registered renderer into a container it owns; the host tracks the instance
 * and disposes it when the entry deactivates.
 */
interface DockRenderersContext {
  /** Register a renderer for a dock `type`. Returns an unregister function. */
  register: (type: string, renderer: DockRenderer) => () => void;
  /** Look up the renderer registered for a dock `type`, if any. */
  get: (type: string) => DockRenderer | undefined;
  /** Whether a renderer is registered for a dock `type`. */
  has: (type: string) => boolean;
  /**
   * Mount the entry's registered renderer into `container`. Resolves to a
   * disposer; the same instance is also disposed automatically when the entry
   * deactivates. Warns and resolves to a no-op disposer when no renderer is
   * registered for the entry's type.
   */
  mount: (entry: DevframeDockEntry, container: HTMLElement) => Promise<() => void>;
}
//#endregion
//#region src/client/docks.d.ts
interface DockPanelStorage {
  mode: 'float' | 'edge';
  width: number;
  height: number;
  top: number;
  left: number;
  position: 'left' | 'right' | 'bottom' | 'top';
  open: boolean;
  inactiveTimeout: number;
}
type DockClientType = 'embedded' | 'standalone';
interface DocksContext extends DevframeRpcContext {
  /**
   * Type of the client environment
   *
   * 'embedded' - running inside an embedded floating panel
   * 'standalone' - running inside a standalone window (no user app)
   */
  readonly clientType: 'embedded' | 'standalone';
  /**
   * The panel context
   */
  readonly panel: DocksPanelContext;
  /**
   * The docks entries context
   */
  readonly docks: DocksEntriesContext;
  /**
   * The commands context for command palette and shortcuts
   */
  readonly commands: CommandsContext;
  /**
   * The when-clause context for conditional visibility
   */
  readonly when: WhenClauseContext;
  /**
   * The live connection status of the underlying devframe client, so a viewer
   * can render one central connection indicator for every docked plugin
   * instead of each plugin surfacing its own.
   */
  readonly connection: DocksConnectionContext;
  /**
   * The dock-renderer registry. Routes a dock `type` to a host-registered
   * renderer (e.g. `@devframes/json-render-ui` for `'json-render'`). The hub
   * itself ships no renderers.
   */
  readonly renderers: DockRenderersContext;
}
interface DocksConnectionContext {
  /** The current connection status. */
  readonly status: DevframeConnectionStatus;
  /** The most recent connection-level error, or `null` when healthy. */
  readonly error: Error | null;
  /**
   * The client's event emitter — subscribe to `connection:status`,
   * `connection:error`, and `rpc:error` to react to changes.
   */
  readonly events: EventEmitter<RpcClientEvents$1>;
}
interface WhenClauseContext {
  /**
   * Get the current when-clause context snapshot.
   * Returns a reactive object with built-in variables and any custom plugin variables.
   */
  readonly context: WhenContext;
}
type DevframeClientContext = DocksContext;
interface DocksPanelContext {
  store: DockPanelStorage;
  isDragging: boolean;
  isResizing: boolean;
  readonly isVertical: boolean;
}
interface DocksEntriesContext {
  selectedId: string | null;
  readonly selected: DevframeDockEntry | null;
  entries: DevframeDockEntry[];
  entryToStateMap: Map<string, DockEntryState>;
  groupedEntries: DevframeDockEntriesGrouped;
  settings: SharedState<DevframeDocksUserSettings>;
  /**
   * Get the state of a dock entry by its ID
   */
  getStateById: (id: string) => DockEntryState | undefined;
  /**
   * Switch to the selected dock entry, pass `null` to clear the selection
   *
   * @returns Whether the selection was changed successfully
   */
  switchEntry: (id?: string | null) => Promise<boolean>;
  /**
   * Toggle the selected dock entry
   *
   * @returns Whether the selection was changed successfully
   */
  toggleEntry: (id: string) => Promise<boolean>;
  /**
   * Register a **client-only** dock entry, live in this page and merged with
   * the server-provided docks (`devframe:docks` shared state) into
   * {@link entries}. Unlike a dock registered on the node
   * {@link import('../types/docks').DevframeDocksHost}, it never flows into
   * shared state, so it stays local to this client instead of syncing to the
   * hub or other viewers — for a view a client host synthesizes itself.
   *
   * Throws when `id` already names a client dock, unless `force` is set. A
   * client dock sharing an id with a server dock overrides it in the local
   * merge. Returns a handle to {@link DockRegistration.update patch} or
   * {@link DockRegistration.dispose remove} it.
   */
  register: <T extends DevframeDockEntry>(entry: T, force?: boolean) => DockRegistration<T>;
  /**
   * Replace a previously {@link register client-registered} dock entry, keyed
   * by `id`. Throws when no client dock owns that id.
   */
  update: (entry: DevframeDockUserEntry) => void;
}
interface DockRegistration<T extends DevframeDockEntry = DevframeDockEntry> {
  /**
   * Patch the registered client dock in place. The `id` is immutable — passing
   * a differing `id` throws.
   */
  update: (patch: Partial<T>) => void;
  /** Remove the client dock from the local merge. */
  dispose: () => void;
}
interface DockEntryState {
  entryMeta: DevframeDockEntry;
  readonly isActive: boolean;
  domElements: {
    iframe?: HTMLIFrameElement | null;
    panel?: HTMLDivElement | null;
  };
  events: EventEmitter<DockEntryStateEvents>;
}
interface DockEntryStateEvents {
  'entry:activated': () => void;
  'entry:deactivated': () => void;
  'entry:updated': (newMeta: DevframeDockUserEntry) => void;
  'dom:panel:mounted': (panel: HTMLDivElement) => void;
  'dom:iframe:mounted': (iframe: HTMLIFrameElement) => void;
}
interface CommandsContext {
  /**
   * All commands (server + client)
   */
  readonly commands: DevframeCommandEntry[];
  /**
   * Palette-visible commands only (filtered by `showInPalette !== false`)
   */
  readonly paletteCommands: DevframeCommandEntry[];
  /**
   * Register client-side command(s). Returns cleanup function.
   */
  register: (cmd: DevframeClientCommand | DevframeClientCommand[]) => () => void;
  /**
   * Execute a command by ID. Delegates to RPC for server commands.
   */
  execute: (id: string, ...args: any[]) => Promise<unknown>;
  /**
   * Get effective keybindings for a command (defaults merged with overrides)
   */
  getKeybindings: (id: string) => DevframeCommandKeybinding[];
  /**
   * User settings store (persisted, includes command shortcuts)
   */
  settings: SharedState<DevframeDocksUserSettings>;
  /**
   * Whether the command palette is open
   */
  paletteOpen: boolean;
}
//#endregion
//#region src/client/client-script.d.ts
/**
 * Context for client scripts running in dock entries
 */
interface DockClientScriptContext extends DocksContext {
  /**
   * The state of the current dock entry
   */
  current: DockEntryState;
  /**
   * Messages client scoped to this dock entry — messages it adds default
   * their `category` to the entry id, so the feed can attribute them.
   */
  messages: DevframeMessagesClient;
}
//#endregion
//#region src/client/context.d.ts
declare const CLIENT_CONTEXT_KEY = "__DEVFRAME_HUB_CLIENT_CONTEXT__";
/**
 * Get the global Devframe client context, or `undefined` if not yet initialized.
 */
declare function getDevframeClientContext(): DevframeClientContext | undefined;
/**
 * Publish the global Devframe client context (or clear it with `undefined`).
 * Called by {@link import('./host').createDevframeClientHost}; a dock client
 * script or a viewer reads it back with {@link getDevframeClientContext}.
 */
declare function setDevframeClientContext(ctx: DevframeClientContext | undefined): void;
//#endregion
//#region src/client/dock-resources.d.ts
/**
 * Resolve a dock iframe URL relative to the Devframe server that provided the
 * dock entry. This keeps root-relative and dot-relative paths on the host
 * server when an external viewer renders the hub.
 */
declare function resolveDockUrl(url: string, connection: DevframeConnection): string;
/** Resolve URL-backed dock icons while preserving Iconify names and data URLs. */
declare function resolveDockIcon(icon: DevframeDockEntryIcon, connection: DevframeConnection): DevframeDockEntryIcon;
//#endregion
//#region src/client/frame-nav.d.ts
/**
 * Shared-iframe soft navigation — the viewer-side half of a host↔iframe
 * `postMessage` protocol.
 *
 * An {@link DevframeViewIframe.subTabs anchor} iframe dock owns one live iframe
 * (its {@link DevframeViewIframe.frameId frameId}); the embedded app ships a
 * tiny **nav shim** that announces its tabs and answers navigation over
 * `postMessage`. This adapter, auto-attached by the client host when the anchor
 * iframe mounts, runs the ready handshake, turns the reported tab manifest into
 * **client-only** member docks (via {@link DocksEntriesContext.register}), and
 * drives the bidirectional nav loop:
 *
 * - selecting a member dock posts a `navigate` (client-side, no reload);
 * - the app posts `navigated` on any internal navigation, moving the dock
 *   highlight to match.
 *
 * The protocol is server-free (works cross-origin and in static builds) and
 * decoupled — the embedded app takes no hub/RPC dependency, only the shim.
 */
/** `postMessage` channel tag shared by both halves of the protocol. */
declare const FRAME_NAV_CHANNEL = "devframe:frame-nav";
/** Protocol version. */
declare const FRAME_NAV_VERSION = 1;
/** Envelope every frame-nav message carries. */
interface FrameNavEnvelope {
  channel: typeof FRAME_NAV_CHANNEL;
  v: typeof FRAME_NAV_VERSION;
  frameId: string;
  /** Direction tag; each side ignores messages with its own `from`. */
  from: 'host' | 'frame';
}
/**
 * One tab in the manifest the shim reports. Maps directly onto a dock entry, so
 * a materialized member dock is first-class.
 */
interface FrameTab {
  /** Unique within the frame. The member dock id becomes `<frameId>:<id>`. */
  id: string;
  title: string;
  icon?: DevframeDockEntryIcon;
  /** Soft-nav target the app maps to its own router. */
  navTarget: NavTarget;
  /**
   * Absolute or anchor-relative URL used for the boot deep-link and the
   * hard-nav fallback. When omitted, one is derived from the anchor URL +
   * `navTarget.path` (hash routing).
   */
  fallbackUrl?: string;
  badge?: string;
  order?: number;
  category?: string;
  when?: string;
  groupId?: string;
}
/** Host → frame message payloads (without the {@link FrameNavEnvelope}). */
type FrameNavHostPayload = {
  type: 'hello';
} | {
  type: 'navigate';
  tabId: string;
  navTarget: NavTarget;
};
/** Host → frame messages. */
type FrameNavHostMessage = FrameNavEnvelope & {
  from: 'host';
} & FrameNavHostPayload;
/** Frame → host messages. */
type FrameNavFrameMessage = FrameNavEnvelope & {
  from: 'frame';
} & ({
  type: 'ready';
  tabs: FrameTab[];
  current?: string;
} | {
  type: 'manifest';
  tabs: FrameTab[];
  current?: string;
} | {
  type: 'navigated';
  tabId?: string;
  navTarget?: NavTarget;
});
/** Minimal window surface the adapter listens on (injectable for tests). */
interface FrameNavListenTarget {
  addEventListener: (type: 'message', listener: (ev: MessageEvent) => void) => void;
  removeEventListener: (type: 'message', listener: (ev: MessageEvent) => void) => void;
}
interface FrameNavClientOptions {
  /** The shared frame id (defaults to the anchor's, else the anchor id). */
  frameId: string;
  /** The anchor iframe dock entry — supplies url/icon/groupId defaults. */
  anchor: DevframeViewIframe;
  /** The live iframe element hosting the embedded app. */
  iframe: Pick<HTMLIFrameElement, 'contentWindow' | 'src'>;
  /** Client docks context — to register members and drive selection. */
  docks: Pick<DocksEntriesContext, 'register' | 'switchEntry' | 'getStateById'>;
  /**
   * Window to receive the frame's `message` events on (the host page window).
   * Defaults to `globalThis`.
   */
  window?: FrameNavListenTarget;
  /** Expected origin for `postMessage`; derived from the anchor URL otherwise. */
  origin?: string;
  /** @default 3000 */
  handshakeTimeoutMs?: number;
}
interface FrameNavClient {
  /** Whether the shim has completed its `ready` handshake. */
  readonly ready: boolean;
  /** The tab id currently shown in the frame, or `null`. */
  readonly currentTabId: string | null;
  dispose: () => void;
}
/**
 * Attach the frame-nav adapter to a mounted anchor iframe. Returns a handle
 * exposing readiness/current state and a `dispose()` that removes every member
 * dock it registered and detaches its listener.
 */
declare function attachFrameNavClient(options: FrameNavClientOptions): FrameNavClient;
//#endregion
//#region src/client/host.d.ts
interface DevframeClientHostOptions {
  /**
   * An already-connected RPC client. When omitted, one is created via
   * `connectDevframe(connect)` — pass `connect.baseURL` to point at the hub's
   * connection-meta mount (e.g. `/__hub/`).
   */
  rpc?: DevframeRpcClient;
  /** Options forwarded to `connectDevframe` when `rpc` is not supplied. */
  connect?: DevframeRpcClientOptions;
  /**
   * Environment the host runs in.
   * - `'standalone'` (default) — the runtime owns the whole page (a hub UI).
   * - `'embedded'` — the runtime lives inside a user app alongside a panel.
   */
  clientType?: DockClientType;
  /**
   * Import and run the client scripts declared on dock entries (`action`,
   * `custom-render`, and iframe `clientScript`). Default `true`.
   */
  loadClientScripts?: boolean;
  /**
   * Dock renderers to register at boot, keyed by dock `type`. The host
   * application injects the ones it wants (e.g.
   * `{ 'json-render': createJsonRenderDockRenderer() }` from
   * `@devframes/json-render-ui`). The hub ships none by default.
   */
  renderers?: Record<string, DockRenderer>;
  /**
   * Hub-wide override of the top-level dock-bar category ordering — a map of
   * category id → ordering weight (lower sorts earlier), mirroring the shape
   * of {@link import('../constants').DEFAULT_CATEGORIES_ORDER}.
   *
   * This is the OUTER bucket ordering: it governs every ungrouped entry's own
   * `category` and every group's `category` (see
   * {@link import('../types/docks').DevframeDockEntryBase.category}). It is
   * distinct from {@link import('../types/docks').DevframeViewGroup.categoryOrder},
   * which only reorders the IN-GROUP sub-categories of one specific group.
   *
   * Keys are merged over `DEFAULT_CATEGORIES_ORDER`, so the host app only
   * lists the categories it wants to move; any category absent from the map
   * keeps its default weight (falling back to `0`).
   *
   * @example
   * ```ts
   * // Surface `data` tools ahead of `app` tools, hub-wide.
   * createDevframeClientHost({ categoryOrder: { data: 50 } })
   * ```
   */
  categoryOrder?: Record<string, number>;
}
interface DevframeClientHost {
  /** The assembled, globally-registered client host context. */
  context: DevframeClientContext;
  /** Tear down listeners and stop tracking newly-registered client scripts. */
  dispose: () => void;
}
/**
 * Boot the framework-level client host: connect RPC, assemble the full
 * {@link DevframeClientContext} (panel, docks, commands, when) from the hub's
 * shared state, publish it at `__DEVFRAME_HUB_CLIENT_CONTEXT__`, and load every
 * dock entry's client script into this page — the devframe equivalent of the
 * runtime `@vitejs/devtools-kit` injects into a host app.
 *
 * A viewer keeps rendering its own dock UI (reading the same shared state); this
 * runtime is what gives plugin client scripts a live host context to run in.
 */
declare function createDevframeClientHost(options?: DevframeClientHostOptions): Promise<DevframeClientHost>;
//#endregion
//#region src/client/messages.d.ts
interface MessagesClientOptions {
  /**
   * Default fields merged beneath every `add()` input — the client host passes
   * `{ category: entry.id }` to scope a dock client script's messages to its
   * entry. Fields set on the input itself win.
   */
  defaults?: Partial<DevframeMessageEntryInput>;
}
/**
 * Build a browser-side {@link DevframeMessagesClient} that writes into the
 * hub's messages subsystem over the `hub:messages:*` built-in RPCs. The handle
 * returned by `add` proxies `update`/`dismiss` back through the same RPCs, so a
 * dock client script reports into the very feed the server writes to.
 */
declare function createMessagesClient(rpc: DevframeRpcClient, options?: MessagesClientOptions): DevframeMessagesClient;
//#endregion
//#region src/remote-url.d.ts
/** Remove the remote connection descriptor from a URL before displaying or copying it. */
declare function stripRemoteConnectionFromUrl(input: string): string;
//#endregion
//#region src/client/remote.d.ts
type ConnectRemoteDevframeOptions = Omit<DevframeRpcClientOptions, 'connectionMeta' | 'authToken'>;
/**
 * Build an external viewer URL from an existing trusted Devframe connection.
 * Returns the original URL if the connection has no auth token, does not use
 * WebSockets, or has an invalid metadata URL.
 */
declare function buildRemoteDevframeUrl(url: string, connection: DevframeConnection): string;
/**
 * Parse a {@link RemoteConnectionInfo} descriptor from the current page's URL
 * (or a provided URL/string). Checks the URL fragment first, then the query.
 *
 * Returns `null` if no descriptor is present.
 * Throws if the descriptor is malformed or its schema version is unsupported.
 */
declare function parseRemoteConnection(input?: string): RemoteConnectionInfo | null;
/**
 * One-liner for a hosted Devframe page: reads the connection descriptor from
 * the current URL and returns a connected {@link DevframeRpcClient}.
 *
 * Pairs with `remote: true` on a `DevframeViewIframe` registered on the node
 * side — the hub injects the descriptor into the iframe URL.
 *
 * @throws if no descriptor is present in the URL.
 */
declare function connectRemoteDevframe(options?: ConnectRemoteDevframeOptions): Promise<DevframeRpcClient>;
//#endregion
export { CLIENT_CONTEXT_KEY, CommandsContext, ConnectRemoteDevframeOptions, DEFAULT_CATEGORIES_ORDER, DevframeClientContext, DevframeClientHost, DevframeClientHostOptions, type DevframeClientRpcHost, DockClientScriptContext, DockClientType, DockEntryState, DockEntryStateEvents, DockPanelStorage, DockRegistration, DockRenderer, DockRendererInstance, DockRendererMountOptions, DockRenderersContext, DocksConnectionContext, DocksContext, DocksEntriesContext, DocksPanelContext, FRAME_NAV_CHANNEL, FRAME_NAV_VERSION, FrameNavClient, FrameNavClientOptions, FrameNavEnvelope, FrameNavFrameMessage, FrameNavHostMessage, FrameNavHostPayload, FrameNavListenTarget, FrameTab, MessagesClientOptions, type RpcClientEvents, WhenClauseContext, attachFrameNavClient, buildRemoteDevframeUrl, connectRemoteDevframe, createDevframeClientHost, createMessagesClient, getDevframeClientContext, parseRemoteConnection, resolveDockIcon, resolveDockUrl, setDevframeClientContext, stripRemoteConnectionFromUrl };