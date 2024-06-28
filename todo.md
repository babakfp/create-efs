# Todo

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
