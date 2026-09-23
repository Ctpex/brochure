import { isAllowedOrigin } from "./rpc/transports/ws-server.mjs";
import { n as createHostContext } from "./host-h3-D2hYZvDK.mjs";
import { t as diagnostics } from "./diagnostics-D7wM2cwM.mjs";
import { t as toAgentToolName } from "./agent-tool-name-C3b5vEwJ.mjs";
import { randomUUID } from "node:crypto";
import { Diagnostic } from "nostics";
import { join } from "pathe";
import process from "node:process";
import { homedir } from "node:os";
import { Server, WebStandardStreamableHTTPServerTransport, isInitializeRequest } from "@modelcontextprotocol/server";
//#region src/adapters/mcp/stringify.ts
/**
* JSON-coercing serializer for MCP text payloads.
*
* MCP carries tool results and resource reads as plain text over a
* JSON-RPC transport, so we cannot use the `s:`-prefixed structured-clone
* format the WS RPC transport falls back to for non-JSON values. Instead,
* we coerce common non-JSON types into JSON-friendly forms so the LLM
* client sees something useful instead of `[object Object]`.
*
* Coercions:
*   - `BigInt` → `"123n"`
*   - `Date` → ISO string (via the native `toJSON`)
*   - `Map` → `{ __type: 'Map', entries: [[k, v], …] }`
*   - `Set` → `{ __type: 'Set', entries: [v, …] }`
*   - `Error` → `{ name, message, stack, cause? }` (cause recurses)
*   - `Function` → `"[Function: name]"`
*   - `Symbol` → `value.toString()`
*   - cycles → `"[Circular]"`
*/
function stringifyForMcp(value) {
	if (value === void 0) return "undefined";
	if (typeof value === "string") return value;
	const seen = /* @__PURE__ */ new WeakSet();
	return JSON.stringify(value, (_key, val) => {
		if (typeof val === "bigint") return `${val}n`;
		if (val instanceof Error) {
			const out = {
				name: val.name,
				message: val.message,
				stack: val.stack
			};
			if (val.cause !== void 0) out.cause = val.cause;
			return out;
		}
		if (val instanceof Map) return {
			__type: "Map",
			entries: [...val.entries()]
		};
		if (val instanceof Set) return {
			__type: "Set",
			entries: [...val]
		};
		if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
		if (typeof val === "symbol") return val.toString();
		if (val !== null && typeof val === "object") {
			if (seen.has(val)) return "[Circular]";
			seen.add(val);
		}
		return val;
	}, 2);
}
/**
* Format a thrown value for an MCP `isError` text payload.
*
* A nostics `Diagnostic` (every coded devframe error) becomes structured
* JSON — `{ error: { code, message, fix?, docs? } }` — so an agent receives
* the actionable next step (`fix`) and the docs URL instead of a bare
* message string. Other errors surface `Error.name`/`message`, plus one
* level of `cause.message` so context isn't dropped silently.
*/
function formatMcpError(error) {
	if (error instanceof Diagnostic) return JSON.stringify({ error: {
		code: error.code,
		message: error.message,
		...error.fix ? { fix: error.fix } : {},
		...error.docs ? { docs: error.docs } : {}
	} }, null, 2);
	if (!(error instanceof Error)) return String(error);
	const cause = error.cause;
	const causeText = cause instanceof Error ? ` (cause: ${cause.message})` : cause !== void 0 ? ` (cause: ${String(cause)})` : "";
	return `${error.name}: ${error.message}${causeText}`;
}
//#endregion
//#region src/adapters/mcp/to-json-schema.ts
const FALLBACK_OBJECT_SCHEMA = Object.freeze({
	type: "object",
	additionalProperties: true
});
/**
* Convert a Standard Schema to JSON Schema for the agent/MCP surface.
*
* Devframe stays validator-neutral, so conversion uses the schema's own
* [Standard JSON Schema](https://standardschema.dev/) converter
* (`~standard.jsonSchema`) when the validator provides one — zod 4 does,
* for example. Validators without a native converter (e.g. valibot) degrade
* to a permissive object schema rather than pulling in a converter library.
*/
function safeToJsonSchema(schema) {
	const standard = schema["~standard"];
	if (standard.jsonSchema) try {
		return standard.jsonSchema.input({ target: "draft-2020-12" });
	} catch {
		return FALLBACK_OBJECT_SCHEMA;
	}
	return FALLBACK_OBJECT_SCHEMA;
}
/**
* JSON Schema for an RPC return value on the agent/MCP surface.
* @internal
*/
function returnToJsonSchema(schema) {
	if (!schema) return void 0;
	return safeToJsonSchema(schema);
}
/**
* JSON Schema for an RPC function's positional args on the agent/MCP
* surface. Each positional arg is advertised under `arg0` / `arg1` / … —
* matching how the agent bridge coerces the incoming object payload back
* into positional arguments.
*
* Returns `{ type: 'object', properties: {} }` when there are no args.
* @internal
*/
function argsToJsonSchema(args) {
	if (!args || args.length === 0) return {
		schema: {
			type: "object",
			properties: {}
		},
		unwrapped: false
	};
	const properties = {};
	const required = [];
	for (let i = 0; i < args.length; i++) {
		const key = `arg${i}`;
		properties[key] = safeToJsonSchema(args[i]);
		required.push(key);
	}
	return {
		schema: {
			type: "object",
			properties,
			required,
			additionalProperties: false
		},
		unwrapped: false
	};
}
//#endregion
//#region src/adapters/mcp/build-server.ts
/**
* Wire an MCP {@link Server} to a devframe context. Returns the server
* plus a disposal function for the subscriptions it sets up. The
* transport is the caller's responsibility — `createMcpServer` connects
* stdio; tests can connect an {@link InMemoryTransport} instead.
*
* @internal
*/
function buildMcpServerFromContext(ctx, options) {
	const server = new Server({
		name: options.serverName,
		version: options.serverVersion
	}, { capabilities: {
		tools: { listChanged: true },
		resources: { listChanged: true }
	} });
	registerToolHandlers(server, ctx, options.exposeSharedState);
	registerResourceHandlers(server, ctx, options.exposeSharedState);
	const notify = (method) => {
		server.notification({ method }).catch(() => {});
	};
	const offManifest = ctx.agent.events.on("agent:manifest:changed", () => {
		notify("notifications/tools/list_changed");
		notify("notifications/resources/list_changed");
	});
	const offKeyAdded = ctx.rpc.sharedState.onKeyAdded(() => {
		notify("notifications/resources/list_changed");
	});
	return {
		server,
		dispose: () => {
			offManifest();
			offKeyAdded();
		}
	};
}
/**
* Build an MCP server over the agent surface of a devframe definition.
* Currently supports `stdio` transport only.
*
* @experimental The agent-native surface is experimental and may change
* without a major version bump until it stabilizes.
*/
async function createMcpServer(definition, options = {}) {
	const transport = options.transport ?? "stdio";
	if (transport !== "stdio") throw diagnostics.DF0017({
		transport,
		reason: "Only stdio transport is supported in this release."
	});
	const ctx = await createHostContext({
		cwd: process.cwd(),
		mode: "dev",
		host: {
			mountStatic: () => {},
			resolveOrigin: () => "mcp://devframe",
			getStorageDir: (scope) => {
				if (scope === "workspace") return join(process.cwd(), ".devframe");
				if (scope === "project") return join(process.cwd(), `node_modules/.${definition.id}/devframe`);
				return join(homedir(), `.${definition.id}/devframe`);
			}
		}
	});
	await definition.setup(ctx);
	const { server, dispose } = buildMcpServerFromContext(ctx, {
		serverName: options.serverName ?? `${definition.id} (devframe)`,
		serverVersion: options.serverVersion ?? definition.version ?? "0.0.0",
		exposeSharedState: options.exposeSharedState ?? true
	});
	const { startStdioTransport } = await import("./transports-vhizgqXM.mjs");
	let stop;
	try {
		stop = await startStdioTransport(server);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw diagnostics.DF0017({
			transport,
			reason,
			cause: error
		});
	}
	options.onReady?.({ transport: "stdio" });
	return { async stop() {
		dispose();
		await stop();
	} };
}
/**
* Id of the built-in shared-state read tool — namespaced like every other
* built-in (`devframe:<area>:<fn>`). Tool-shaped access matters because many
* MCP clients only consume tools — the parallel `devframe://state/<key>`
* resource projection stays for the clients that do read resources.
*/
const READ_STATE_TOOL = "devframe:state:read";
/** Wire name of the built-in shared-state read tool: `devframe_state_read`. */
const READ_STATE_NAME = toAgentToolName(READ_STATE_TOOL);
function sharedStateFilter(exposeSharedState) {
	if (exposeSharedState === false) return void 0;
	return typeof exposeSharedState === "function" ? exposeSharedState : () => true;
}
function readStateToolProjection() {
	return {
		name: READ_STATE_NAME,
		title: "Read shared state",
		description: "Read this devtool's live shared state. Call without arguments to list the available keys, then with a key to get that value as JSON. Safe to call freely.",
		inputSchema: {
			type: "object",
			properties: { key: {
				type: "string",
				description: "A shared-state key from the key list. Omit to list all keys."
			} }
		},
		annotations: {
			title: "Read shared state",
			readOnlyHint: true,
			destructiveHint: false
		}
	};
}
async function readStateResult(ctx, filter, key) {
	const keys = ctx.rpc.sharedState.keys().filter(filter);
	if (key === void 0) return { keys };
	if (!keys.includes(key)) throw diagnostics.DF0048({ key });
	return {
		key,
		value: (await ctx.rpc.sharedState.get(key)).value()
	};
}
function registerToolHandlers(server, ctx, exposeSharedState) {
	const stateFilter = sharedStateFilter(exposeSharedState);
	const warnedCollisions = /* @__PURE__ */ new Set();
	/**
	* Resolve a wire tool name back to the registered {@link AgentTool}.
	* Wire-name matching runs first, in manifest order — the same tool the
	* list projection advertises under that name — with a raw-id fallback so
	* a colon-namespaced id keeps working as a call name.
	*/
	const resolveTool = (name) => {
		return ctx.agent.list().tools.find((tool) => toAgentToolName(tool.id) === name) ?? ctx.agent.getTool(name);
	};
	server.setRequestHandler("tools/list", async () => {
		const byName = /* @__PURE__ */ new Map();
		for (const tool of ctx.agent.list().tools) {
			const name = toAgentToolName(tool.id);
			const existing = byName.get(name);
			if (existing) {
				if (!warnedCollisions.has(`${name}|${tool.id}`)) {
					warnedCollisions.add(`${name}|${tool.id}`);
					diagnostics.DF0047({
						name,
						id: tool.id,
						existing: existing.id
					});
				}
				continue;
			}
			byName.set(name, tool);
		}
		const tools = [...byName.entries()].map(([name, tool]) => projectTool(name, tool, ctx));
		if (stateFilter && !byName.has(READ_STATE_NAME)) tools.push(readStateToolProjection());
		return { tools };
	});
	server.setRequestHandler("tools/call", async (request) => {
		const { name, arguments: args } = request.params;
		try {
			const tool = resolveTool(name);
			if (stateFilter && !tool && (name === READ_STATE_NAME || name === READ_STATE_TOOL)) {
				const key = args?.key;
				const result = await readStateResult(ctx, stateFilter, key);
				return {
					content: [{
						type: "text",
						text: stringifyForMcp(result)
					}],
					structuredContent: result
				};
			}
			const outputSchema = tool ? usableOutputSchema(tool.outputSchema ?? computeOutputSchema(tool, ctx)) : void 0;
			const result = await ctx.agent.invoke(tool?.id ?? name, args ?? {});
			return {
				content: [{
					type: "text",
					text: stringifyForMcp(result)
				}],
				...outputSchema ? { structuredContent: result } : {}
			};
		} catch (error) {
			return {
				isError: true,
				content: [{
					type: "text",
					text: `Error invoking "${name}": ${formatMcpError(error)}`
				}]
			};
		}
	});
}
function registerResourceHandlers(server, ctx, exposeSharedState) {
	server.setRequestHandler("resources/list", async () => {
		const resources = ctx.agent.list().resources.map((resource) => ({
			uri: resource.uri,
			name: resource.name,
			description: resource.description,
			mimeType: resource.mimeType
		}));
		if (exposeSharedState !== false) {
			const filter = typeof exposeSharedState === "function" ? exposeSharedState : () => true;
			for (const key of ctx.rpc.sharedState.keys()) {
				if (!filter(key)) continue;
				resources.push({
					uri: `devframe://state/${encodeURIComponent(key)}`,
					name: key,
					description: `Shared state: ${key}`,
					mimeType: "application/json"
				});
			}
		}
		return { resources };
	});
	server.setRequestHandler("resources/read", async (request) => {
		const { uri } = request.params;
		const parsed = parseResourceUri(uri);
		if (parsed.kind === "resource") {
			const content = await ctx.agent.read(parsed.id);
			return { contents: [{
				uri,
				mimeType: content.mimeType ?? "application/json",
				text: content.text ?? stringifyForMcp(content.json)
			}] };
		}
		if (parsed.kind === "state") return { contents: [{
			uri,
			mimeType: "application/json",
			text: stringifyForMcp((await ctx.rpc.sharedState.get(parsed.key)).value())
		}] };
		throw new Error(`[devframe/mcp] unknown resource URI "${uri}"`);
	});
}
/**
* MCP constrains a tool's `outputSchema` to a JSON Schema of `type:
* "object"` — clients (the SDK included) reject anything else. Non-object
* return schemas (e.g. a schema for `void` / a bare string) simply project
* no output schema; the text content still carries the result.
*/
function usableOutputSchema(schema) {
	return schema && typeof schema === "object" && schema.type === "object" ? schema : void 0;
}
function projectTool(name, tool, ctx) {
	const inputSchema = tool.inputSchema ?? computeInputSchema(tool, ctx);
	const outputSchema = usableOutputSchema(tool.outputSchema ?? computeOutputSchema(tool, ctx));
	return {
		name,
		title: tool.title,
		description: tool.description,
		inputSchema,
		...outputSchema ? { outputSchema } : {},
		annotations: {
			title: tool.title,
			readOnlyHint: tool.safety === "read",
			destructiveHint: tool.safety === "destructive"
		}
	};
}
function computeInputSchema(tool, ctx) {
	if (tool.kind === "tool") return argsToJsonSchema(tool.args).schema;
	if (tool.kind !== "rpc" || !tool.rpcName) return {
		type: "object",
		properties: {}
	};
	const def = ctx.rpc.definitions.get(tool.rpcName);
	if (!def) return {
		type: "object",
		properties: {}
	};
	const args = def.args;
	return argsToJsonSchema(args).schema;
}
function computeOutputSchema(tool, ctx) {
	if (tool.kind !== "rpc" || !tool.rpcName) return void 0;
	const def = ctx.rpc.definitions.get(tool.rpcName);
	if (!def) return void 0;
	return returnToJsonSchema(def.returns);
}
function parseResourceUri(uri) {
	const match = uri.match(/^devframe:\/\/(resource|state)\/(.+)$/);
	if (!match) return { kind: "unknown" };
	const [, kind, rest] = match;
	const decoded = decodeURIComponent(rest);
	if (kind === "resource") return {
		kind: "resource",
		id: decoded
	};
	return {
		kind: "state",
		key: decoded
	};
}
//#endregion
//#region src/adapters/mcp/fetch.ts
/**
* Build a framework-agnostic MCP Streamable-HTTP endpoint over a devframe
* context: a web-standard `Request → Response` handler any host can mount —
* h3 (see `mountMcpHttp`), a Next.js App Router route, or any other
* fetch-shaped server.
*
* Each MCP session gets its own {@link WebStandardStreamableHTTPServerTransport}
* and MCP server (built from the shared, live `ctx` via
* `buildMcpServerFromContext`), correlated by the `Mcp-Session-Id` header: an
* `initialize` POST spins up a session; later requests route to it; a `DELETE`
* (or client disconnect) tears it down. The origin gate guards every request:
* loopback-default DNS-rebinding protection that — unlike the WS upgrade's
* `isAllowedOrigin` — also rejects `Origin`-less requests, so a route-based
* endpoint isn't reachable by an arbitrary local process.
*
* @experimental
*/
function createMcpFetchHandler(ctx, options) {
	const sessions = /* @__PURE__ */ new Map();
	const allowedOrigins = options.allowedOrigins;
	function drop(sessionId) {
		const session = sessions.get(sessionId);
		if (!session) return;
		sessions.delete(sessionId);
		session.dispose();
	}
	async function createSession() {
		let session;
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => randomUUID(),
			onsessioninitialized: (id) => {
				sessions.set(id, session);
			},
			onsessionclosed: (id) => {
				drop(id);
			}
		});
		const { server, dispose } = buildMcpServerFromContext(ctx, {
			serverName: options.serverName,
			serverVersion: options.serverVersion,
			exposeSharedState: options.exposeSharedState
		});
		session = {
			transport,
			dispose: async () => {
				dispose();
				await server.close();
			}
		};
		transport.onclose = () => {
			if (transport.sessionId) drop(transport.sessionId);
		};
		await server.connect(transport);
		return session;
	}
	async function handle(req) {
		const origin = req.headers.get("origin") ?? void 0;
		if (allowedOrigins !== false && (origin === void 0 || !isAllowedOrigin(origin, allowedOrigins ?? []))) return new Response("Forbidden: origin required", { status: 403 });
		const sessionId = req.headers.get("mcp-session-id") ?? void 0;
		let session = sessionId ? sessions.get(sessionId) : void 0;
		if (!session && req.method === "POST") {
			let body;
			try {
				body = await req.json();
			} catch {
				body = void 0;
			}
			if (!sessionId && isInitializeRequest(body)) session = await createSession();
			else return new Response(sessionId ? "Not Found: unknown MCP session" : "Bad Request: no valid session ID and not an initialize request", { status: sessionId ? 404 : 400 });
			return session.transport.handleRequest(req, { parsedBody: body });
		}
		if (!session) return new Response(sessionId ? "Not Found: unknown MCP session" : "Bad Request: missing MCP session ID", { status: sessionId ? 404 : 400 });
		return session.transport.handleRequest(req);
	}
	return {
		fetch: handle,
		dispose: async () => {
			const live = [...sessions.values()];
			sessions.clear();
			await Promise.all(live.map((session) => session.dispose()));
		}
	};
}
//#endregion
export { createMcpServer as n, createMcpFetchHandler as t };
