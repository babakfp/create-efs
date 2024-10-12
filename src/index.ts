import { Downloader } from "nodejs-file-downloader"
import color from "picocolors"
import {
    copyDir,
    copyFile,
    editFile,
    editJson,
    exec,
    exists,
    join,
    makeDir,
    readDir,
    readJson,
    removeDir,
    rename,
    toPosix,
    writeFile,
    type ExecException,
} from "./helpers/node/index.js"
import { appendLines } from "./utilities/appendLines.js"
import { fetchPbLatestReleaseAssets } from "./utilities/fetchPbLatestReleaseAssets.js"
import { createPrompter } from "./utilities/prompts.js"
import { createSpinner } from "./utilities/spinner.js"
import { unZip } from "./utilities/unZip.js"

const isNode = !process.env.npm_config_user_agent
const isPnpm = !!process.env.npm_config_user_agent?.includes("pnpm")
/** Current module directory. */
const cmd = isNode ? process.cwd() : join(import.meta.dirname, "..")

const prompts: {
    namePath: string
    db: boolean
    realtimeDb: boolean
    markdown: boolean
    env: boolean
    svelteAdapter: (typeof SVELTE_ADAPTERS)[keyof typeof SVELTE_ADAPTERS]
    scaffold: boolean
    git: boolean
} = {
    namePath: "",
    db: false,
    realtimeDb: false,
    markdown: false,
    env: false,
    svelteAdapter: "@sveltejs/adapter-auto",
    scaffold: false,
    git: true,
}

const { version }: { version: string } = await readJson(
    join(cmd, "package.json"),
)

const prompter = await createPrompter()
const spinner = createSpinner()

prompter.insertIntro(
    `${color.bgCyan(color.black(` Easy Full Stack `))}  v${version}`,
    true,
)

if (!isNode && !isPnpm) {
    prompter.exit("Only PNPM is supported.")
}

prompts.namePath = await prompter.addTextPrompt({
    message: "Path",
    placeholder: "Hit Enter to use the current directory.",
})

const appCwd = join(process.cwd(), prompts.namePath)

if (exists(appCwd)) {
    if ((await readDir(appCwd)).length) {
        const dirNotEmpty = await prompter.addRadioPrompt({
            message: "Directory Not Empty",
            options: [
                { label: "Exit", value: "exit" },
                {
                    label: "Delete!",
                    value: "delete",
                    hint: ` ${toPosix(appCwd)} `,
                },
            ],
        })

        if (dirNotEmpty === "exit") {
            prompter.exit("Exited.")
        } else if (dirNotEmpty === "delete") {
            spinner.start("Deleting")
            await removeDir(appCwd)
            spinner.stop("Deleted.")
        }
    }
}

prompts.db = await prompter.addConfirmPrompt({
    message: "Database",
    initialValue: prompts.db,
})

const clientCwd = !prompts.db ? appCwd : join(appCwd, "client")

if (prompts.db) {
    prompts.realtimeDb = await prompter.addConfirmPrompt({
        message: "Realtime Database",
        initialValue: prompts.realtimeDb,
    })
} else {
    prompts.env = await prompter.addConfirmPrompt({
        message: "Env",
        initialValue: prompts.env,
    })
}

prompts.markdown = await prompter.addConfirmPrompt({
    message: "Markdown",
    initialValue: prompts.markdown,
})

const SVELTE_ADAPTERS = {
    Auto: "@sveltejs/adapter-auto",
    Netlify: "@sveltejs/adapter-netlify",
    Node: "@sveltejs/adapter-node",
    Static: "@sveltejs/adapter-static",
    Vercel: "@sveltejs/adapter-vercel",
} as const

prompts.svelteAdapter = await prompter.addRadioPrompt({
    message: "Adapter",
    options: Object.entries(SVELTE_ADAPTERS).map(([label, value]) => ({
        label,
        value,
    })),
})

prompts.scaffold = await prompter.addConfirmPrompt({
    message: "Scaffold",
    initialValue: prompts.scaffold,
})

prompts.git = await prompter.addConfirmPrompt({
    message: "Git",
    initialValue: prompts.git,
})

// Fetch PocketBase releases

const pbLatestReleaseAssets: Awaited<
    ReturnType<typeof fetchPbLatestReleaseAssets>
> = []
let selectedPbReleaseName = ""

if (prompts.db) {
    try {
        spinner.start("Fetching latest PocketBase release assets")
        pbLatestReleaseAssets.push(...(await fetchPbLatestReleaseAssets()))
        spinner.stop("Fetched PocketBase release assets.")

        selectedPbReleaseName = pbLatestReleaseAssets[0].name

        if (pbLatestReleaseAssets.length > 1) {
            selectedPbReleaseName = await prompter.addRadioPrompt({
                message: "Choose an Asset",
                options: pbLatestReleaseAssets.map((asset) => ({
                    label: asset.name,
                    value: asset.name,
                })),
            })
        }
    } catch (e) {
        spinner.stop(
            "Couldn't fetch PocketBase release.",
            (e as ExecException).code,
        )
        prompter.exit("Exited.")
    }
}

if (prompts.namePath !== "" && !exists(appCwd)) {
    await makeDir(appCwd)
}

await copyDir(join(cmd, "templates", "SvelteKit"), clientCwd)

// These files are prefix because they are ignored by the NPM registry. https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files
await rename(join(clientCwd, "..gitignore"), join(clientCwd, ".gitignore"))
await rename(join(clientCwd, "..npmrc"), join(clientCwd, ".npmrc"))

if (prompts.db || (!prompts.db && prompts.env)) {
    await editFile(join(clientCwd, ".gitignore"), (content) =>
        appendLines(content, "/.svelte-kit/", [
            "/.env",
            "/.env.*",
            "!/.env.example",
        ]),
    )
}

if (!prompts.db && prompts.env) {
    await writeFile(join(clientCwd, ".env"), "")
    await writeFile(join(clientCwd, ".env.example"), "")
}

if (prompts.db) {
    await copyDir(join(cmd, "templates", "PocketBase Client"), clientCwd)

    // ---

    const envPublicPrefix = prompts.realtimeDb ? "PUBLIC_" : ""

    const getEnvFileContent = () => {
        const defaultUrl = "http://127.0.0.1:8090"

        const content =
            [
                `${envPublicPrefix}PB_URL="${defaultUrl}" # Used to connect to DB and PocketBase type generation CLI`,
                `PB_EMAIL="" # Used for PocketBase type generation CLI`,
                `PB_PASSWORD="" # Used for PocketBase type generation CLI`,
            ].join("\n") + "\n"

        return content
    }

    await writeFile(join(clientCwd, ".env"), getEnvFileContent())
    await writeFile(join(clientCwd, ".env.example"), getEnvFileContent())

    // --- PocketBase

    await copyDir(join(cmd, "templates", "PocketBase"), appCwd)

    // --- Download PocketBase Executable

    const pbVersion = selectedPbReleaseName.split("_")[1]

    await editFile(join(appCwd, "storage", "Dockerfile"), (content) =>
        content.replace(
            "ARG PB_VERSION=0.22.12",
            `ARG PB_VERSION=${pbVersion}`,
        ),
    )

    const downloadUrl = pbLatestReleaseAssets.filter(
        (asset) => asset.name === selectedPbReleaseName,
    )[0].downloadUrl

    const downloader = new Downloader({
        url: downloadUrl,
        directory: join(appCwd, "storage"),
    })

    let isDownloadSeccessful = false

    try {
        spinner.start("Downloading PocketBase")
        await downloader.download()
        spinner.stop("Downloaded PocketBase.")

        isDownloadSeccessful = true
    } catch {
        spinner.stop("Couldn't download PocketBase.", 1)
        prompter.exit("Exited.")
    }

    if (isDownloadSeccessful) {
        await unZip(join(appCwd, "storage", selectedPbReleaseName))
    }

    // --- PocketBase Type Generation

    const typeGenOutputPath = join(
        "src",
        "lib",
        prompts.realtimeDb ? "" : "server",
        "pb",
        "types.ts",
    )

    const pbTypeGenScript = {
        key: "pb-types",
        value: `pocketbase-auto-generate-types -u ${envPublicPrefix}PB_URL -e PB_EMAIL -p PB_PASSWORD -o ${toPosix(typeGenOutputPath)}`,
    }

    await editJson(join(clientCwd, "package.json"), (json) => {
        json.scripts[pbTypeGenScript.key] = pbTypeGenScript.value
        return json
    })
}

// Markdown
if (prompts.markdown) {
    await editFile(join(clientCwd, "svelte.config.js"), (content) => {
        content =
            `import { EXTENSIONS, mdxPreprocess } from "mdx-svelte"\n` + content
        content = content.replace(
            `vitePreprocess()`,
            `[mdxPreprocess(), vitePreprocess()],`,
        )
        return content
    })
}

// ---

if (prompts.svelteAdapter !== SVELTE_ADAPTERS.Auto) {
    await editFile(join(clientCwd, "svelte.config.js"), (content) =>
        content.replace(SVELTE_ADAPTERS.Auto, prompts.svelteAdapter),
    )

    // ---

    await editFile(join(clientCwd, ".gitignore"), (content) => {
        const replaceWith: string[] = []

        if (
            prompts.svelteAdapter === "@sveltejs/adapter-node" ||
            prompts.svelteAdapter === "@sveltejs/adapter-static"
        ) {
            replaceWith.push("/build/")
        } else if (prompts.svelteAdapter === "@sveltejs/adapter-vercel") {
            replaceWith.push("/.vercel/")
        } else if (prompts.svelteAdapter === "@sveltejs/adapter-netlify") {
            replaceWith.push("/.netlify/")
        }

        return appendLines(content, "/.svelte-kit/", replaceWith)
    })
}

if (prompts.scaffold) {
    await copyFile(
        join(
            cmd,
            "templates",
            "SvelteKit Simple Scaffold",
            "tailwind.config.ts",
        ),
        join(clientCwd, "tailwind.config.ts"),
    )
    await copyFile(
        join(cmd, "templates", "SvelteKit Simple Scaffold", "src", "app.html"),
        join(clientCwd, "src", "app.html"),
    )
    await copyFile(
        join(
            cmd,
            "templates",
            "SvelteKit Simple Scaffold",
            "src",
            "error.html",
        ),
        join(clientCwd, "src", "error.html"),
    )
    await copyFile(
        join(
            cmd,
            "templates",
            "SvelteKit Simple Scaffold",
            "src",
            "lib",
            "app.css",
        ),
        join(clientCwd, "src", "lib", "app.css"),
    )
    await copyDir(
        join(cmd, "templates", "SvelteKit Simple Scaffold", "static"),
        join(clientCwd, "static"),
    )
}

try {
    spinner.start("Installing dependencies")

    const pnpmDevDeps = []

    const commands = [`cd ${clientCwd}`, "pnpm up --latest"]

    if (prompts.db) {
        pnpmDevDeps.push("pocketbase", "pocketbase-auto-generate-types")
    }

    if (prompts.markdown) {
        pnpmDevDeps.push("mdx-svelte")
    }

    if (prompts.svelteAdapter !== SVELTE_ADAPTERS.Auto) {
        commands.push(`pnpm rm ${SVELTE_ADAPTERS.Auto}`)
        pnpmDevDeps.push(prompts.svelteAdapter)

        if (prompts.svelteAdapter === SVELTE_ADAPTERS.Node) {
            pnpmDevDeps.push("@types/node")
        }
    }

    if (prompts.scaffold) {
        pnpmDevDeps.push("remeda")
    }

    if (pnpmDevDeps.length) {
        commands.push(`pnpm add -D ${pnpmDevDeps.join(" ")}`)
    }

    // Building the initial styles for the `src/error.html` file.
    commands.push("pnpm error-build")

    await exec(commands.join(" && "))

    spinner.stop("Installed dependencies.")
} catch (e) {
    await removeDir(appCwd)

    spinner.stop("Couldn't install dependencies.", (e as ExecException).code)
    prompter.exit("Exited.")
}

if (prompts.git) {
    try {
        spinner.start("Initializing Git")

        await exec(
            [
                `cd ${clientCwd}`,
                "git init",
                "git add .",
                'git commit -m "First commit"',
            ].join(" && "),
        )

        spinner.stop("Initialized Git.")
    } catch (e) {
        spinner.stop("Couldn't initialize Git.", (e as ExecException).code)
        prompter.exit("Exited.")
    }
}

prompter.insertOutro("Your app is ready.")
