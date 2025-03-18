# Easy Full Stack

A CLI tool to create SvelteKit apps.

```bash
pnpm create efs@latest
```

## Prompts

```
┌  Easy Full Stack
│
◆  Path
│  Hit Enter to use the current directory.
│
├────┐
│    ◆  Directory Not Empty
│    │  ● Exit
│    │  ○ Delete! ( <DIRECTORY> )
│    │
│    ├────┐
│    │    ◇  Exit
│    │    └  Exited.
│    │
│    ◇  Delete!
│    │  Directory deleted.
├────┘
│
◆  Database
│  ○ Yes / ● No
│
├────┬────┐
│    │    ◇  No
│    │    │
│    │    ◆  Env
│    │    │  ○ Yes / ● No
│    │    │
│    │    └──────────────────────┐
│    │                           │
│    ◇  Yes                      │
│    │                           │
│    ◆  Realtime Database        │
│    │  ○ Yes / ● No             │
│    │                           │
├────┴───────────────────────────┘
│
◆  Markdown
│  ○ Yes / ● No
│
◆  Adapter
│  ● Auto
│  ○ Node
│  ○ Static
│  ○ Vercel
│  ○ Netlify
│
◆  Scaffold
│  ○ Yes / ● No
│
◇  Dependencies installed.
│
◆  Git
│  ● Yes / ○ No
│
└  All done.
```

## FrontEnd & BackEnd

- [Svelte](https://svelte.dev)
- [SvelteKit](https://kit.svelte.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Prettier](https://prettier.io)
- [Prettier Plugin Svelte](https://github.com/sveltejs/prettier-plugin-svelte)
- [Prettier Plugin Sort Imports](https://github.com/IanVS/prettier-plugin-sort-imports)
- [Prettier Plugin Tailwind CSS](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

## Storage

- [PocketBase](https://pocketbase.io)
- [SQLite](https://www.sqlite.org)

## vsCode Extensions

### Project Specific

These extensions are essential.

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Tailwind CSS](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

These extensions are useful.

- [Svelte Snippets](https://marketplace.visualstudio.com/items?itemName=fivethree.vscode-svelte-snippets)
- [Inline Fold](https://marketplace.visualstudio.com/items?itemName=moalamri.inline-fold)

### General

- [Bearded Icons](https://marketplace.visualstudio.com/items?itemName=BeardedBear.beardedicons)
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [JSDoc Markdown Highlighting](https://marketplace.visualstudio.com/items?itemName=bierner.jsdoc-markdown-highlighting)
- [Open File](https://marketplace.visualstudio.com/items?itemName=Fr43nk.seito-openfile)
- [Open Folder in Explorer](https://marketplace.visualstudio.com/items?itemName=adrianwilczynski.open-folder-in-explorer)
- [Peek Hidden Files](https://marketplace.visualstudio.com/items?itemName=adrianwilczynski.toggle-hidden)
- [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)
- [Select Line Status Bar](https://marketplace.visualstudio.com/items?itemName=tomoki1207.selectline-statusbar)
- [Text Transformer](https://marketplace.visualstudio.com/items?itemName=jackytsu.text-transformer)

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
    "experimentalOperatorPosition": "start",
    "experimentalTernaries": true,

    // Extension: [Inline Fold](https://marketplace.visualstudio.com/items?itemName=moalamri.inline-fold)
    "inlineFold.maskChar": "...",
    "inlineFold.unfoldedOpacity": 1,
    "inlineFold.unfoldOnLineSelect": true,
    "inlineFold.disableInDiffEditor": true,
    // Fixes qurly brackets (`{}`) not being folded.
    "inlineFold.regex": "(class)=\"(.*?)\"",
    "inlineFold.regexGroup": "2",

    // Extension: [Tailwind CSS](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
    "tailwindCSS.colorDecorators": false, // Because they don't get folded.
    "tailwindCSS.emmetCompletions": true,
    "files.associations": {
        "*.css": "tailwindcss",
    },

    // https://github.com/antfu/vscode-file-nesting-config
}
```
