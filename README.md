# Easy Full Stack

-   Svelte
-   SvelteKit
-   PocketBase
-   TailwindCSS
-   SQLite

-   FullStack
-   -   Prettier
-   -   -   Import formatter
-   -   -   TailwindCSS formatter
-   -   -   Svelte formatter
-   -   TailwindCSS
-   Only FrontEnd
-   -   Prettier
-   -   -   Import formatter
-   -   -   TailwindCSS formatter
-   -   -   Svelte formatter
-   -   TailwindCSS

Rnadom cute project names and favicons

---

todo
data-sveltekit-preload-data="hover" or ...

TOOD

```json
importOrder: ["^@", "^[^$\\.\\/]", "^\\$", "^\\.\\.", "^\\."],
importOrderSortSpecifiers: true,
```

---

A function for `svelte.config.js` to disable some wornings. Example:

```js
{
       onwarn: (warning, handler) => {
        if (
            warning.code.startsWith("a11y-") ||
            warning.code === "avoid-mouse-events-on-document"
        )
            return
        handler(warning)
    },
}
```

A section about vsCode extensions in the `README.md` file.

A section about commands and packages and etc. Everything...

A section about fontsource site.

A section about user auth in `hooks.server.ts` and etc.
