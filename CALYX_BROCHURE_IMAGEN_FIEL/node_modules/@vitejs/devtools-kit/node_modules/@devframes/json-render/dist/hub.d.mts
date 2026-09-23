import { i as JsonRenderViewRef, n as JsonRenderView } from "./types-CC2-FD2H.mjs";
import { DevframeDockEntryBase } from "@devframes/hub/types";
//#region src/hub.d.ts
/**
 * A `json-render` dock entry. Contributed to the hub's **open** dock union
 * (`DevframeDockEntryRegistry`) by this opt-in integration — the hub itself
 * hard-codes no json-render variant. Carries only the serializable
 * {@link JsonRenderViewRef}; no functions cross the wire.
 */
interface DevframeJsonRenderDockEntry extends DevframeDockEntryBase {
  type: 'json-render';
  /** Serializable reference the client subscribes through. */
  view: JsonRenderViewRef;
}
declare module '@devframes/hub/types' {
  interface DevframeDockEntryRegistry {
    'json-render': DevframeJsonRenderDockEntry;
  }
}
/**
 * Build a `json-render` dock entry from a {@link JsonRenderView} and the dock
 * metadata (id, title, icon, …). Projects the view down to its serializable
 * {@link JsonRenderViewRef} so it survives dock projection into shared state.
 */
declare function toJsonRenderDockEntry(view: JsonRenderView, meta: Omit<DevframeJsonRenderDockEntry, 'type' | 'view'>): DevframeJsonRenderDockEntry;
//#endregion
export { DevframeJsonRenderDockEntry, toJsonRenderDockEntry };