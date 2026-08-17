// The markdown templates in brain/templates/ are imported as text
// (`with { type: "text" }`), which Bun inlines at run time and embeds when the
// brain is compiled with `bun build --compile`. TypeScript has no loader for
// `.md`, so it is told what such an import yields.
declare module "*.md" {
  const contents: string;
  export default contents;
}

// The repo-root VERSION file is imported the same way (see main.ts).
declare module "*/VERSION" {
  const contents: string;
  export default contents;
}
