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
◆  Install Dependencies?
│  ● Yes / ○ No
│
◆  Use Git?
│  ● Yes / ○ No
│
└  Your app is ready.
```

## FrontEnd & BackEnd

-   [Svelte](https://svelte.dev)
-   [SvelteKit](https://kit.svelte.dev)
-   [TailwindCSS](https://tailwindcss.com)
-   [Prettier](https://prettier.io)
-   [Prettier Plugin Svelte](https://github.com/sveltejs/prettier-plugin-svelte)
-   [Prettier Plugin TailwindCSS](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
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
-   [TailwindCSS](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### General

These extensions are useful.

-   [Auto Comment Blocks](https://marketplace.visualstudio.com/items?itemName=kevinkyang.auto-comment-blocks)
-   [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)
-   [Bearded Icons](https://marketplace.visualstudio.com/items?itemName=BeardedBear.beardedicons)
-   [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
-   [Compare Folders](https://marketplace.visualstudio.com/items?itemName=moshfeu.compare-folders)
-   [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
-   [Inline Fold](https://marketplace.visualstudio.com/items?itemName=moalamri.inline-fold)
-   [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
-   [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)
-   [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)
-   [Select Line Status Bar](https://marketplace.visualstudio.com/items?itemName=tomoki1207.selectline-statusbar)
-   [Supermaven](https://marketplace.visualstudio.com/items?itemName=supermaven.supermaven)
-   [Text Transformer](https://marketplace.visualstudio.com/items?itemName=jackytsu.text-transformer)

## vsCode Config

```json
{
    // Formatting

    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",

    // Extension: Prettier

    "prettier.semi": false,
    "prettier.tabWidth": 4,

    // Extension: Inline Fold

    "inlineFold.maskChar": "...",
    "inlineFold.unfoldedOpacity": 1,
    "inlineFold.unfoldOnLineSelect": true,
    "inlineFold.regex": "(class)=\"(.*?)\"",
    "inlineFold.regexGroup": "2",

    // Extension: Tailwind

    "tailwindCSS.colorDecorators": false,
    "tailwindCSS.emmetCompletions": true,

    // Extension: Svelte

    "[svelte]": {
        "editor.defaultFormatter": "svelte.svelte-vscode"
    },

    // Readonly files

    "files.readonlyInclude": {
        "**/pnpm-lock.yaml": true
    },

    // Workbench

    "workbench.sideBar.location": "right"
}
```
