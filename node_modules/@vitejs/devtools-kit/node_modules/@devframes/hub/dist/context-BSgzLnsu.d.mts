import { C as DevframeDocksHost, L as JsonRenderSpec, R as JsonRenderer, l as DevframeCommandsHost, m as DevframeDockActivation, y as DevframeDockEntryIcon } from "./settings-Byh48aCd.mjs";
import { CreateHostContextOptions } from "devframe/node";
import { DevframeHost, DevframeNodeContext, EventEmitter } from "devframe/types";
import { ChildProcess } from "node:child_process";
//#region src/types/messages.d.ts
type DevframeMessageLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';
type DevframeMessageEntryFrom = 'server' | 'browser';
interface DevframeMessageElementPosition {
  /** CSS selector for the element */
  selector?: string;
  /** Bounding box of the element */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Human-readable description of the element */
  description?: string;
}
interface DevframeMessageFilePosition {
  /** Absolute or relative file path */
  file: string;
  /** Line number (1-based) */
  line?: number;
  /** Column number (1-based) */
  column?: number;
}
/**
 * A labeled control a message can carry. Rendered by the messages panel; when
 * clicked it drives the described intent. Discriminated by `kind` so further
 * action kinds can be added without reshaping the field.
 *
 * `'activate'` requests the viewer switch its focused dock to `activate.dockId`
 * (deep-linking via the opaque, serializable `activate.params` bag the target
 * dock interprets), via the hub's `hub:docks:activate` RPC.
 */
interface DevframeMessageActivateAction {
  /** Stable id for the action within its entry. */
  id: string;
  /** Button label shown in the messages panel. */
  label: string;
  kind: 'activate';
  /** The dock to focus, plus an optional deep-link params bag. */
  activate: {
    dockId: string;
    params?: Record<string, unknown>;
  };
}
type DevframeMessageAction = DevframeMessageActivateAction;
interface DevframeMessageEntry {
  /**
   * Unique identifier for this message entry (auto-generated if not provided)
   */
  id: string;
  /**
   * Short title or summary of the message
   */
  message: string;
  /**
   * Optional detailed description or explanation
   */
  description?: string;
  /**
   * Severity level, determines color and icon
   */
  level: DevframeMessageLevel;
  /**
   * Optional stack trace string
   */
  stacktrace?: string;
  /**
   * Optional DOM element position info (e.g., for a11y issues)
   */
  elementPosition?: DevframeMessageElementPosition;
  /**
   * Optional source file position info (e.g., for lint errors)
   */
  filePosition?: DevframeMessageFilePosition;
  /**
   * Whether this message should also appear as a toast notification
   */
  notify?: boolean;
  /**
   * Origin of the message entry, automatically set by the context
   */
  from: DevframeMessageEntryFrom;
  /**
   * Grouping category (e.g., 'a11y', 'lint', 'runtime', 'test')
   */
  category?: string;
  /**
   * Optional tags/labels for filtering
   */
  labels?: string[];
  /**
   * Optional labeled actions (e.g. "navigate to a dock") the panel renders as
   * clickable controls in the entry's detail view.
   */
  actions?: DevframeMessageAction[];
  /**
   * Time in ms to auto-dismiss the toast notification (client-side)
   */
  autoDismiss?: number;
  /**
   * Time in ms to auto-delete this message entry (server-side)
   */
  autoDelete?: number;
  /**
   * Timestamp when the message was created (auto-generated if not provided)
   */
  timestamp: number;
  /**
   * Status of the message entry (e.g., 'loading' while an operation is in progress).
   * Defaults to 'idle' when not specified.
   */
  status?: 'loading' | 'idle';
}
/**
 * Input type for creating a message entry.
 * `id`, `timestamp`, and `from` are auto-filled by the host.
 */
type DevframeMessageEntryInput = Omit<DevframeMessageEntry, 'id' | 'timestamp' | 'from'> & {
  id?: string;
  timestamp?: number;
};
interface DevframeMessageHandle {
  /** The underlying message entry data */
  readonly entry: DevframeMessageEntry;
  /** Shortcut to entry.id */
  readonly id: string;
  /** Partial update of this message entry */
  update: (patch: Partial<DevframeMessageEntryInput>) => Promise<DevframeMessageEntry | undefined>;
  /** Remove this message entry */
  dismiss: () => Promise<void>;
}
/**
 * Extra fields accepted by the per-level message shortcuts —
 * everything on {@link DevframeMessageEntryInput} except the
 * `message` and `level` the shortcut itself provides.
 */
type DevframeMessageShortcutInput = Omit<DevframeMessageEntryInput, 'message' | 'level'>;
/**
 * Per-level shortcuts shared by the client and the node host —
 * `messages.info('...')` is `messages.add({ message: '...', level: 'info' })`.
 */
interface DevframeMessagesLevelShortcuts {
  /** Shortcut for `add({ message, level: 'info', ...extra })` */
  info: (message: string, extra?: DevframeMessageShortcutInput) => Promise<DevframeMessageHandle>;
  /** Shortcut for `add({ message, level: 'warn', ...extra })` */
  warn: (message: string, extra?: DevframeMessageShortcutInput) => Promise<DevframeMessageHandle>;
  /** Shortcut for `add({ message, level: 'error', ...extra })` */
  error: (message: string, extra?: DevframeMessageShortcutInput) => Promise<DevframeMessageHandle>;
  /** Shortcut for `add({ message, level: 'success', ...extra })` */
  success: (message: string, extra?: DevframeMessageShortcutInput) => Promise<DevframeMessageHandle>;
  /** Shortcut for `add({ message, level: 'debug', ...extra })` */
  debug: (message: string, extra?: DevframeMessageShortcutInput) => Promise<DevframeMessageHandle>;
}
interface DevframeMessagesClient extends DevframeMessagesLevelShortcuts {
  /**
   * Add a message entry. Returns a Promise resolving to a handle for subsequent updates/dismissal.
   * Can be used without `await` for fire-and-forget usage.
   */
  add: (input: DevframeMessageEntryInput) => Promise<DevframeMessageHandle>;
  /** Remove a message entry by id */
  remove: (id: string) => Promise<void>;
  /** Clear all message entries */
  clear: () => Promise<void>;
}
/**
 * A snapshot or delta of the message list, as returned by
 * {@link DevframeMessagesHost.listSince}. Consumers apply `removedIds`
 * first, then upsert `entries`, and pass `version` back as `since` on the
 * next call.
 */
interface DevframeMessagesListDelta {
  /** Entries added or updated since the cursor (or all entries when `full`) */
  entries: DevframeMessageEntry[];
  /** Ids removed since the cursor (empty when `full`) */
  removedIds: string[];
  /** The version cursor — pass back as `since` on the next call */
  version: number;
  /**
   * When `true`, `entries` is the complete snapshot and any locally cached
   * list must be reset before applying it.
   */
  full: boolean;
}
interface DevframeMessagesHost extends DevframeMessagesLevelShortcuts {
  readonly entries: Map<string, DevframeMessageEntry>;
  readonly events: EventEmitter<{
    'message:added': (entry: DevframeMessageEntry) => void;
    'message:updated': (entry: DevframeMessageEntry) => void;
    'message:removed': (id: string) => void;
    'message:cleared': () => void;
  }>;
  /**
   * Add a new message entry. If an entry with the same `id` already exists, it will be updated instead.
   * Returns a handle for subsequent updates/dismissal. Can be used without `await` for fire-and-forget.
   */
  add: (entry: DevframeMessageEntryInput) => Promise<DevframeMessageHandle>;
  /**
   * Update an existing message entry by id (partial update)
   */
  update: (id: string, patch: Partial<DevframeMessageEntryInput>) => Promise<DevframeMessageEntry | undefined>;
  /**
   * Remove a message entry by id
   */
  remove: (id: string) => Promise<void>;
  /**
   * Clear all message entries
   */
  clear: () => Promise<void>;
  /**
   * Read the message list incrementally. Pass the `version` from the
   * previous result as `since` to receive only the entries modified and the
   * ids removed after that point; pass `null`/`undefined` for the initial
   * full snapshot. When the host can no longer compute a reliable delta for
   * the given cursor (trimmed removal history, or a cursor from another host
   * incarnation), the result carries `full: true` with the complete list.
   */
  listSince: (since?: number | null) => DevframeMessagesListDelta;
}
//#endregion
//#region src/types/terminals.d.ts
interface DevframeTerminalsHost {
  readonly sessions: Map<string, DevframeTerminalSession>;
  readonly events: EventEmitter<{
    'terminal:session:updated': (session: DevframeTerminalSession) => void;
  }>;
  register: (session: DevframeTerminalSession) => DevframeTerminalSession;
  update: (session: DevframeTerminalSession) => void;
  /** Drop a session from the registry, disposing its bound output stream. */
  remove: (session: DevframeTerminalSession) => void;
  /**
   * Spawn a read-only child process (pipe-backed, output only). Use this for
   * long-running logs and dev servers that don't need input.
   */
  startChildProcess: (executeOptions: DevframeChildProcessExecuteOptions, terminal: Omit<DevframeTerminalSessionBase, 'status'>) => Promise<DevframeChildProcessTerminalSession>;
  /**
   * Spawn a fully interactive pseudo-terminal (PTY) any plugin can drive:
   * keystrokes via {@link DevframePtyTerminalSession.write}, live layout via
   * {@link DevframePtyTerminalSession.resize}, TUI-capable. The session is
   * marked `interactive`, so a hub-aware terminal UI (e.g. the terminals
   * plugin) surfaces it as writable rather than read-only. Powered by
   * `zigpty` — where its native bindings can't load, it degrades to
   * pipe-based terminal emulation.
   */
  startPtySession: (executeOptions: DevframePtyExecuteOptions, terminal: Omit<DevframeTerminalSessionBase, 'status'>) => Promise<DevframePtyTerminalSession>;
}
type DevframeTerminalStatus = 'running' | 'stopped' | 'error';
interface DevframeTerminalSessionBase {
  id: string;
  title: string;
  description?: string;
  status: DevframeTerminalStatus;
  icon?: DevframeDockEntryIcon;
  /**
   * Whether the session accepts input (keystrokes + resize). `true` for
   * {@link DevframeTerminalsHost.startPtySession} sessions; absent/`false`
   * for pipe-backed, output-only ones. A hub-aware terminal UI reads this to
   * decide whether to enable stdin and wire resize.
   */
  interactive?: boolean;
  /**
   * Whether the session may be restarted in place (re-running its command).
   * Defaults to `true`. Set `false` for sessions whose lifecycle is owned
   * elsewhere — e.g. a one-shot build, or a server (like code-server) that
   * should be restarted through its own controls rather than by re-spawning
   * the raw process. A hub-aware terminal UI hides its restart affordance for
   * these, and `hub:terminals:restart` rejects them.
   */
  restartable?: boolean;
}
interface DevframeTerminalSession extends DevframeTerminalSessionBase {
  buffer?: string[];
  stream?: ReadableStream<string>;
}
interface DevframeChildProcessExecuteOptions {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}
/**
 * The settled outcome of a {@link DevframeChildProcessTerminalSession} run —
 * stdout/stderr captured separately (unlike the session's merged display
 * `stream`), plus the process's exit code (`undefined` if it was killed by a
 * signal before exiting).
 */
interface DevframeChildProcessOutput {
  stdout: string;
  stderr: string;
  exitCode: number | undefined;
}
/**
 * A live handle on a child process's outcome — mirrors the ergonomics of
 * `tinyexec`'s `Result` (a promise-like paired with synchronous accessors) so
 * callers migrating from a `tinyexec`/`execa`-based subprocess API (e.g.
 * Nuxt DevTools' `startSubprocess().getResult()`) can adopt
 * {@link DevframeTerminalsHost.startChildProcess} with minimal changes.
 * `await`ing it (or calling `.then()`) resolves once the process exits, with
 * the full captured {@link DevframeChildProcessOutput}.
 */
interface DevframeChildProcessResult extends PromiseLike<DevframeChildProcessOutput> {
  readonly pid: number | undefined;
  /** `undefined` while the process is still running. */
  readonly exitCode: number | undefined;
  readonly killed: boolean;
  kill: (signal?: NodeJS.Signals | number) => boolean;
}
interface DevframeChildProcessTerminalSession extends DevframeTerminalSession {
  type: 'child-process';
  executeOptions: DevframeChildProcessExecuteOptions;
  getChildProcess: () => ChildProcess | undefined;
  /**
   * Get a live handle on the current run's outcome. Reflects the most recent
   * `restart()` — call it again after restarting to track the new run.
   */
  getResult: () => DevframeChildProcessResult;
  terminate: () => Promise<void>;
  /** Throws `DF8206` once the session's output stream has closed (after a natural exit or `terminate()`) — drop it with `ctx.terminals.remove(session)` and start a fresh session instead. */
  restart: () => Promise<void>;
}
interface DevframePtyExecuteOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  /** Initial column count. Default: 80. */
  cols?: number;
  /** Initial row count. Default: 24. */
  rows?: number;
}
interface DevframePtyTerminalSession extends DevframeTerminalSession {
  type: 'pty';
  interactive: true;
  executeOptions: DevframePtyExecuteOptions;
  /** Send keystrokes / raw input to the PTY. */
  write: (data: string) => void;
  /** Resize the PTY (emits SIGWINCH so TUIs relayout). */
  resize: (cols: number, rows: number) => void;
  /** Current foreground process name, when the backend can resolve it. */
  getProcessName: () => string | undefined;
  terminate: () => Promise<void>;
  /** Throws `DF8206` once the session's output stream has closed (after a natural exit or `terminate()`) — drop it with `ctx.terminals.remove(session)` and start a fresh session instead. */
  restart: () => Promise<void>;
}
//#endregion
//#region src/node/context.d.ts
declare module 'devframe/types' {
  interface DevframeRpcClientFunctions {
    /**
     * Server→client request to switch the active dock. Broadcast by the hub
     * context in response to `ctx.docks.activate()` (driven by the
     * `hub:docks:activate` RPC). The client host registers a handler that
     * calls its local `switchEntry(dockId)`; the target dock reads
     * `activation.params` to react (e.g. focus a session). Do not register
     * manually.
     *
     * @internal
     */
    'devframe:docks:activate': (activation: DevframeDockActivation) => Promise<void>;
    /**
     * Server→client notification that terminal sessions changed. Broadcast
     * by the hub context; a hub-aware client re-reads terminal state in
     * response. Do not register manually.
     *
     * @internal
     */
    'devframe:terminals:updated': () => Promise<void>;
    /**
     * Server→client notification that the message list changed. Broadcast
     * by the hub context; a hub-aware client re-reads message state in
     * response. Do not register manually.
     *
     * @internal
     */
    'devframe:messages:updated': () => Promise<void>;
  }
  interface DevframeRpcServerFunctions {
    /**
     * Ask the active viewer to switch its focused dock to `dockId`, optionally
     * carrying `params` for the target dock to interpret (e.g.
     * `{ sessionId }` for the terminals dock). Any connected client may call
     * it — a mounted devframe in its own iframe steers the host shell's dock
     * selection. Handled by {@link import('./rpc-builtins').hubDocksActivate}.
     */
    'hub:docks:activate': (input: {
      dockId: string;
      params?: Record<string, unknown>;
    }) => Promise<void>;
    /**
     * Invoke a registered server command by id; trailing args are forwarded to
     * the command's handler. Handled by
     * {@link import('./rpc-builtins').hubCommandsExecute}.
     */
    'hub:commands:execute': (id: string, ...args: any[]) => Promise<unknown>;
    /**
     * Add a message from a browser client into the hub's messages feed
     * (marked `from: 'browser'`); returns the serializable entry. Handled by
     * {@link import('./rpc-builtins').hubMessagesAdd}.
     */
    'hub:messages:add': (input: DevframeMessageEntryInput) => Promise<DevframeMessageEntry>;
    /** Patch a message by id; resolves the updated entry (or `undefined`). */
    'hub:messages:update': (id: string, patch: Partial<DevframeMessageEntryInput>) => Promise<DevframeMessageEntry | undefined>;
    /** Remove a message by id. */
    'hub:messages:remove': (id: string) => Promise<void>;
    /** Remove every message. */
    'hub:messages:clear': () => Promise<void>;
    /**
     * Send input to an interactive PTY session spawned via
     * `ctx.terminals.startPtySession`. Handled by
     * {@link import('./rpc-builtins').hubTerminalsWrite}.
     */
    'hub:terminals:write': (id: string, data: string) => Promise<void>;
    /** Resize an interactive PTY session by id. */
    'hub:terminals:resize': (id: string, cols: number, rows: number) => Promise<void>;
  }
}
/**
 * Hub-augmented node context — extends devframe's framework-neutral
 * `DevframeNodeContext` with the hub-level subsystems (`docks`,
 * `terminals`, `messages`, `commands`) and the deprecated
 * `createJsonRenderer` compatibility factory.
 *
 * Framework kits further extend this with their own slots (e.g.
 * `viteConfig`, `viteServer`). Host-specific capabilities (editor open,
 * filesystem reveal, etc.) ship as kit-registered RPC functions rather
 * than as part of this surface. JSON-render itself is not part of the hub:
 * it is an opt-in integration (`@devframes/json-render`) that augments any
 * devframe context and contributes its own dock type — prefer
 * `createJsonRenderView` from `@devframes/json-render/node` over the
 * deprecated factory below.
 */
interface DevframeHubContext extends DevframeNodeContext {
  readonly host: DevframeHost;
  docks: DevframeDocksHost;
  terminals: DevframeTerminalsHost;
  messages: DevframeMessagesHost;
  commands: DevframeCommandsHost;
  /**
   * Create a `JsonRenderer` handle for building json-render powered UIs.
   *
   * @deprecated json-render moved out of the hub into the opt-in
   * `@devframes/json-render` integration in 0.7. This factory is kept
   * working (not just type-compatible) for the 0.7 series so existing call
   * sites don't break — use `createJsonRenderView(ctx, { id, spec })` from
   * `@devframes/json-render/node` instead. Will be removed in 0.8.
   */
  createJsonRenderer: (spec: JsonRenderSpec) => JsonRenderer;
}
/**
 * Options for {@link createHubContext} — devframe's
 * {@link CreateHostContextOptions} plus any hub-level additions kits layer on
 * through declaration merging.
 */
interface CreateHubContextOptions extends CreateHostContextOptions {}
/**
 * Create a hub-level node context: wraps devframe's `createHostContext`,
 * attaches the hub hosts (`docks`, `terminals`, `messages`, `commands`),
 * registers the hub's built-in RPC commands, and wires the shared-state
 * synchronization that powers a hub-aware client UI.
 */
declare function createHubContext(options: CreateHubContextOptions): Promise<DevframeHubContext>;
//#endregion
export { DevframeMessageShortcutInput as C, DevframeMessagesListDelta as D, DevframeMessagesLevelShortcuts as E, DevframeMessageLevel as S, DevframeMessagesHost as T, DevframeMessageEntry as _, DevframeChildProcessOutput as a, DevframeMessageFilePosition as b, DevframePtyExecuteOptions as c, DevframeTerminalSessionBase as d, DevframeTerminalStatus as f, DevframeMessageElementPosition as g, DevframeMessageActivateAction as h, DevframeChildProcessExecuteOptions as i, DevframePtyTerminalSession as l, DevframeMessageAction as m, DevframeHubContext as n, DevframeChildProcessResult as o, DevframeTerminalsHost as p, createHubContext as r, DevframeChildProcessTerminalSession as s, CreateHubContextOptions as t, DevframeTerminalSession as u, DevframeMessageEntryFrom as v, DevframeMessagesClient as w, DevframeMessageHandle as x, DevframeMessageEntryInput as y };