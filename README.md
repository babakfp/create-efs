# Easy Full Stack

```bash
pnpm create efs@latest
```

-   Client
    -   [Svelte](https://svelte.dev)
    -   [SvelteKit](https://kit.svelte.dev)
    -   [TailwindCSS](https://tailwindcss.com)
    -   [Prettier](https://prettier.io)
        -   [Svelte Plugin](https://github.com/sveltejs/prettier-plugin-svelte)
        -   [TailwindCSS Plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
        -   [Sort Imports](https://github.com/IanVS/prettier-plugin-sort-imports)
-   Storage
    -   [PocketBase](https://pocketbase.io)
    -   [SQLite](https://www.sqlite.org)

## Todo

-   Random cute project names and favicons.
-   Maybe a function for `svelte.config.js` to disable some warnings. Example:

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

-   vsCode extensions
-   vsCode config
-   A section about vsCode extensions in the `README.md` file.
-   A section about commands and packages and etc. Everything...
-   A section about font source site.
-   A section about user auth in `hooks.server.ts` and etc.
