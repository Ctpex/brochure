//#region ../../node_modules/.pnpm/human-id@4.2.0/node_modules/human-id/dist/index.d.ts
interface Options {
  separator?: string;
  capitalize?: boolean;
  adjectiveCount?: number;
  addAdverb?: boolean;
}
/**
 * Returns the human-id
 */
declare function humanId(options?: Options | string | boolean): string;
//#endregion
export { humanId };