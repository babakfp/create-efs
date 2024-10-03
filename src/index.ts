import ignore from "ignore"
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
    readFile,
    readJson,
    relative,
    removeDir,
    rename,
    toPosix,
    writeFile,
    type ExecException,
} from "./helpers/node/index.js"
import { appendLines } from "./utilities/appendLines.js"
import { getPbReleaseAssets } from "./utilities/getPbReleaseAssets.js"
import { createPrompter, type RadioPromptOptions } from "./utilities/prompts.js"
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
    chooseSvelteKitAdapter: (typeof ADAPTERS)[keyof typeof ADAPTERS]
    isSimpleScaffold: boolean
    isGitInitAndCommit: boolean
    isEnvNeeded: boolean
} = {
    namePath: "",
    db: false,
    realtimeDb: false,
    chooseSvelteKitAdapter: "@sveltejs/adapter-auto",
    isSimpleScaffold: false,
    isGitInitAndCommit: true,
    isEnvNeeded: false,
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
            spinner.stop("Directory deleted.")
        }
    }
}

prompts.db = await prompter.addConfirmPrompt({
    message: "Database",
    initialValue: prompts.db,
})

const clientCwd = !prompts.db ? appCwd : join(appCwd, "client")

if (!prompts.db) {
    prompts.isEnvNeeded = await prompter.addConfirmPrompt({
        message: "Env",
        initialValue: prompts.isEnvNeeded,
    })
}

if (prompts.db) {
    prompts.realtimeDb = await prompter.addConfirmPrompt({
        message: "Realtime Database",
        initialValue: prompts.realtimeDb,
    })
}

const ADAPTERS = {
    Auto: "@sveltejs/adapter-auto",
    Netlify: "@sveltejs/adapter-netlify",
    Node: "@sveltejs/adapter-node",
    Static: "@sveltejs/adapter-static",
    Vercel: "@sveltejs/adapter-vercel",
} as const

const PROMPT_CHOOSE_SVELTE_KIT_ADAPTER_OPTIONS = Object.entries(ADAPTERS).map(
    ([label, value]) => ({ label, value }),
) satisfies RadioPromptOptions

prompts.chooseSvelteKitAdapter = await prompter.addRadioPrompt({
    message: "Adapter",
    options: PROMPT_CHOOSE_SVELTE_KIT_ADAPTER_OPTIONS,
})

prompts.isSimpleScaffold = await prompter.addConfirmPrompt({
    message: "Scaffold",
    initialValue: prompts.isSimpleScaffold,
})

if (prompts.namePath !== "" && !exists(appCwd)) {
    await makeDir(appCwd)
}

const ig = ignore.default().add(
    (await readFile(join(cmd, ".gitignore")))
        .split("\n")
        .map((line) => line.trim())
        .map((line) => (line.endsWith("/") ? line.slice(0, -1) : line)),
)

spinner.start("Doing IO operations")
await copyDir(join(cmd, "templates", "SvelteKit"), clientCwd, {
    filter: (from) => {
        const path = toPosix(join(relative(toPosix(cmd), toPosix(from)), "/"))
        const isIgnored = ig.ignores(path)
        const isCopy = !isIgnored
        return isCopy
    },
})

// These files are prefix because they are ignored by the NPM registry. https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files
await rename(join(clientCwd, "..gitignore"), join(clientCwd, ".gitignore"))
await rename(join(clientCwd, "..npmrc"), join(clientCwd, ".npmrc"))
spinner.stop("IO operations done.")

if (prompts.db || (!prompts.db && prompts.isEnvNeeded)) {
    await editFile(join(clientCwd, ".gitignore"), (content) =>
        appendLines(content, "/.svelte-kit/", [
            "/.env",
            "/.env.*",
            "!/.env.example",
        ]),
    )
}

if (!prompts.db && prompts.isEnvNeeded) {
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

    spinner.start("Fetching PocketBase latest release assets")
    const pbReleases = await getPbReleaseAssets()
    spinner.stop("PocketBase downloaded.")

    if (pbReleases.length) {
        let selectedPbReleaseName: string

        if (pbReleases.length > 1) {
            selectedPbReleaseName = await prompter.addRadioPrompt({
                message: "Choose an Asset",
                options: pbReleases.map((asset) => ({
                    label: asset.name,
                    value: asset.name,
                })),
            })
        } else {
            selectedPbReleaseName = pbReleases[0].name
        }

        const pbVersion = selectedPbReleaseName.split("_")[1]

        await editFile(join(appCwd, "storage", "Dockerfile"), (content) =>
            content.replace(
                "ARG PB_VERSION=0.22.12",
                `ARG PB_VERSION=${pbVersion}`,
            ),
        )

        const downloadUrl = pbReleases.filter(
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
            spinner.stop("PocketBase downloaded.")

            isDownloadSeccessful = true
        } catch {
            spinner.stop("PocketBase download failed.", 1)
        }

        if (isDownloadSeccessful) {
            await unZip(join(appCwd, "storage", selectedPbReleaseName))
        }
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
        value: `pocketbase-auto-generate-types -u ${envPublicPrefix}PB_URL -e PB_EMAIL -p PB_PASSWORD -o ${typeGenOutputPath}`,
    }

    await editJson(join(clientCwd, "package.json"), (json) => {
        json.scripts[pbTypeGenScript.key] = pbTypeGenScript.value
        return json
    })
}

// ---

if (prompts.chooseSvelteKitAdapter !== ADAPTERS.Auto) {
    await editFile(join(clientCwd, "svelte.config.js"), (content) =>
        content.replace(ADAPTERS.Auto, prompts.chooseSvelteKitAdapter),
    )

    // ---

    await editFile(join(clientCwd, ".gitignore"), (content) => {
        const replaceWith: string[] = []

        if (
            prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-node" ||
            prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-static"
        ) {
            replaceWith.push("/build/")
        } else if (
            prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-vercel"
        ) {
            replaceWith.push("/.vercel/")
        } else if (
            prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-netlify"
        ) {
            replaceWith.push("/.netlify/")
        }

        return appendLines(content, "/.svelte-kit/", replaceWith)
    })
}

if (prompts.isSimpleScaffold) {
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

    const commands = [`cd ${clientCwd}`, "pnpm up --latest"]

    if (prompts.db) {
        commands.push("pnpm add -D pocketbase pocketbase-auto-generate-types")
    }

    if (prompts.chooseSvelteKitAdapter !== ADAPTERS.Auto) {
        commands.push(
            ...[
                `pnpm rm ${ADAPTERS.Auto}`,
                `pnpm add -D ${prompts.chooseSvelteKitAdapter}`,
            ],
        )

        if (prompts.chooseSvelteKitAdapter === ADAPTERS.Node) {
            commands.push("pnpm add -D @types/node")
        }
    }

    if (prompts.isSimpleScaffold) {
        commands.push("pnpm add -D remeda")
    }

    await exec(commands.join(" && "))

    spinner.stop("Dependencies installed.")
} catch (e) {
    await removeDir(appCwd)

    spinner.stop(
        "Dependency installation failed. Please try again.",
        (e as ExecException).code,
    )
}

prompts.isGitInitAndCommit = await prompter.addConfirmPrompt({
    message: "Use Git?",
    initialValue: prompts.isGitInitAndCommit,
})

if (prompts.isGitInitAndCommit) {
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

        spinner.stop("Git initialized.")
    } catch (e) {
        spinner.stop("Git initialization failed.", (e as ExecException).code)
    }
}

prompter.insertOutro("Your app is ready.")
