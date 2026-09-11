declare module "isomorphic-fetch" {
  const fetch: typeof globalThis.fetch;
  export default fetch;
}
