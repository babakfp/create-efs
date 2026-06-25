import type { PluginConfig as SortImportsConfig } from "@ianvs/prettier-plugin-sort-imports"
import type { Config as PrettierConfig} from "prettier"
import type { PluginConfig as SvelteConfig } from "prettier-plugin-svelte"
import type { PluginOptions as TailwindcssConfig } from "prettier-plugin-tailwindcss"

export default {
    semi: false,
    tabWidth: 4,
    htmlWhitespaceSensitivity: "ignore",
    experimentalTernaries: true,
    experimentalOperatorPosition: "start",
    plugins: [
        "prettier-plugin-svelte",
        "@ianvs/prettier-plugin-sort-imports",
        "prettier-plugin-tailwindcss",
    ],
    importOrder: [
        "^@",
        "<THIRD_PARTY_MODULES>",
        "^\\$(?!lib/)",
        "^\\$lib/",
        "^[.]",
    ],
} satisfies PrettierConfig & SvelteConfig & SortImportsConfig & TailwindcssConfig
