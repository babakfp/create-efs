# Easy Full Stack

A CLI tool to create SvelteKit apps.

```bash
pnpm create efs@latest
```

## Prompts

```
┌  Welcome (v<VERSION>)
│
◆  Name / Path
│  Hit Enter to use the current directory.
│
├────┐
│    ◆  Directory Not Empty
│    │  ● Exit
│    │  ○ Delete and Continue! (This will delete the directory and all its contents.)
│    │
│    └────┬────┐
│         │    ◇  Exit
│         │    └  Exited.
│         │
│         └────┐
│              ◇  Delete and Continue!
│              │
│              ◆  Delete <DIRECTORY>
│              │  ○ Yes / ● No
│              │
│              └────┬────┐
│                   │    ◇  No
│                   │    └  Exited.
│                   │
│                   ◇  Yes
│                   │  Project deleted.
├───────────────────┘
│
◆  Template
│  ● No Database
│  ○ With Database
│
├────┬────┐
│    │    ◇  No Database
│    │    │
│    │    ◆  Environment Variables?
│    │    │  ○ Yes / ● No
│    │    │
│    │    └──────────────────────────────────────────────────┐
│    │                                                       │
│    └────┐                                                  │
│         ◇  With Database                                   │
│         │                                                  │
│         ◆  Setup PocketBase for real-time features?        │
│         │  ○ Yes / ● No                                    │
│         │                                                  │
│         ├──────────────────────────────────────────────────┘
├─────────┘
│
◆  Adapter
│  ● Auto
│  ○ Node
│  ○ Static
│  ○ Vercel
│  ○ Netlify
│
◆  Simple scaffold?
│  ○ Yes / ● No
│
◇  Dependencies installed.
│
◇  Git initialized.
│
└  Your app is ready.
```

## FrontEnd & BackEnd

-   [Svelte](https://svelte.dev)
-   [SvelteKit](https://kit.svelte.dev)
-   [Tailwind](https://tailwindcss.com)
-   [Prettier](https://prettier.io)
-   [Prettier Plugin Svelte](https://github.com/sveltejs/prettier-plugin-svelte)
-   [Prettier Plugin Tailwind](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
-   [Prettier Plugin Sort Imports](https://github.com/IanVS/prettier-plugin-sort-imports)

## Storage

-   [PocketBase](https://pocketbase.io)
-   [SQLite](https://www.sqlite.org)

## vsCode Extensions

### Project Specific

These extensions are essential.

-   [PostCSS](https://marketplace.visualstudio.com/items?itemName=csstools.postcss)
-   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
-   [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
-   [Tailwind](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### General

These extensions are useful.

-   [Auto Comment Blocks](https://marketplace.visualstudio.com/items?itemName=kevinkyang.auto-comment-blocks)
-   [Bearded Icons](https://marketplace.visualstudio.com/items?itemName=BeardedBear.beardedicons)
-   [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
-   [Inline Fold](https://marketplace.visualstudio.com/items?itemName=moalamri.inline-fold)
-   [JSDoc Markdown Highlighting](https://marketplace.visualstudio.com/items?itemName=bierner.jsdoc-markdown-highlighting)
-   [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
-   [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)
-   [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)
-   [Select Line Status Bar](https://marketplace.visualstudio.com/items?itemName=tomoki1207.selectline-statusbar)
-   [Supermaven](https://marketplace.visualstudio.com/items?itemName=supermaven.supermaven)
-   [Text Transformer](https://marketplace.visualstudio.com/items?itemName=jackytsu.text-transformer)
-   [Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree)

## vsCode Config

```jsonc
{
    // Formatting
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode", // Install [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension.

    // Editor
    "editor.linkedEditing": true, // Edit opening HTML tag, and closing tag will be edited simultaneously (same vise versa). If you have any extension installed that does this, you can uninstall it.

    // Workbench
    "workbench.sideBar.location": "right",

    /**
     * https://github.com/microsoft/vscode/issues/223107#issuecomment-2292519067.
     * - `src/routes/+page.svelte`:               `+page.svelte`.
     * - `src/routes/about/+page.svelte`:         `about/+page.svelte`.
     * - `src/routes/posts/[id]/+page.svelte`:    `posts/[id]/+page.svelte`.
     */
    "workbench.editor.customLabels.patterns": {
        "**/+*.*": "${dirname}/${filename}.${extname}",
        "**/[[]*[]]/+*.*": "${dirname(1)}/${dirname(0)}/${filename}.${extname}",
        "**/routes/+*.*": "${filename}.${extname}",
    },

    // Extension: [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    "prettier.semi": false, // Keep code clean by removing semicolons.
    "prettier.tabWidth": 4, // Improve readability.

    // Extension: [Inline Fold](https://marketplace.visualstudio.com/items?itemName=moalamri.inline-fold)
    "inlineFold.maskChar": "...",
    "inlineFold.unfoldedOpacity": 1,
    "inlineFold.unfoldOnLineSelect": true,
    "inlineFold.disableInDiffEditor": true,
    // Fixes qurly brackets (`{}`) not being folded.
    "inlineFold.regex": "(class)=\"(.*?)\"",
    "inlineFold.regexGroup": "2",

    // Extension: [Tailwind](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
    "tailwindCSS.colorDecorators": false, // Because they don't get folded.
    "tailwindCSS.emmetCompletions": true,

    // Extension: [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)
    "path-intellisense.extensionOnImport": true,
    "path-intellisense.autoTriggerNextSuggestion": true,
    "path-intellisense.autoSlashAfterDirectory": true,
    "path-intellisense.mappings": {
        "%sveltekit.assets%": "${workspaceFolder}/static", // You will get intellisense for the static folder after typing `%sveltekit.assets%/`.
    },
}
```
