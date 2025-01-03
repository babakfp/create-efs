import { omit } from "remeda"
import type { Config } from "tailwindcss"
import { allAddons } from "tailwindcss-addons"
import { neutral } from "tailwindcss/colors"
import { fontWeight } from "tailwindcss/defaultTheme"

export default {
    content: ["./src/**/*.{html,svelte}"],
    theme: {
        extend: {
            colors: {
                gray: neutral,
            },
            container: {
                center: true,
                padding: "1rem",
            },
            borderRadius: {
                DEFAULT: "0.5rem",
            },
        },
        fontFamily: {
            sans: ["Recursive"],
            mono: ["Recursive", { fontVariationSettings: "'MONO' 1" }],
        },
        fontWeight: {
            ...omit(fontWeight, ["thin", "extralight"]),
            extrablack: "1000",
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
        disableColorOpacityUtilitiesByDefault: true,
    },
    plugins: [...allAddons()],
} satisfies Config
