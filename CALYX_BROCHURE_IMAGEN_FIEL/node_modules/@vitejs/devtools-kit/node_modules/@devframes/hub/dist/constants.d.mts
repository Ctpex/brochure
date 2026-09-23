import { t as DevframeDocksUserSettings } from "./settings-Byh48aCd.mjs";
export * from "devframe/constants";
//#region src/constants.d.ts
/**
 * The default ordering weight for each known dock category — lower sorts
 * earlier. Downstream viewers (e.g. `@vitejs/devtools-kit`) import this as the
 * single source of truth so the hub and its viewers agree on category order.
 * `framework` sorts first; `~builtin` (the viewer's own built-in views) last.
 *
 * The buckets read from "closest to your app" → "platform / analysis" →
 * "peripheral". Gaps between the weights are intentional: a kit can interleave
 * its own categories (or override these) without editing this table.
 */
declare const DEFAULT_CATEGORIES_ORDER: Record<string, number>;
declare const DEFAULT_STATE_USER_SETTINGS: () => DevframeDocksUserSettings;
//#endregion
export { DEFAULT_CATEGORIES_ORDER, DEFAULT_STATE_USER_SETTINGS };