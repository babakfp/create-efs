import { type Config } from "prettier"
import { type PluginConfig } from "prettier-plugin-svelte"

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
} satisfies Config & PluginConfig
