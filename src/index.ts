import { Downloader } from "nodejs-file-downloader"
import { exec, type ExecException } from "./helpers/node/child-process/index.js"
import {
    copyDir,
    copyFile,
    editFile,
    editJson,
    exists,
    join,
    makeDir,
    readDir,
    readJson,
    removeDir,
    rename,
    writeFile,
} from "./helpers/node/fs/index.js"
import { appendLines } from "./utilities/appendLines.js"
import { getLatestReleaseAssets } from "./utilities/getLatestReleaseAssets.js"
import { createPrompter, type RadioPromptOptions } from "./utilities/prompts.js"
import { unZip } from "./utilities/unZip.js"

const isUaNode = !process.env.npm_config_user_agent
const isUaPnpm = !!process.env.npm_config_user_agent?.includes("pnpm")
const uaCwd = isUaNode ? process.cwd() : join(import.meta.dirname, "..")

const prompts: {
    enterNameOrPath: string
    chooseWhatIfDirectoryNotEmpty: (typeof PROMPT_DIRECTORY_NOT_EMPTY_OPTIONS)[number]["value"]
    chooseTemplate: (typeof PROMPT_CHOOSE_TEMPLATE_OPTIONS)[number]["value"]
    isRealTimePbNeeded: boolean
    chooseSvelteKitAdapter: (typeof ADAPTERS)[keyof typeof ADAPTERS]
    isSimpleScaffold: boolean
    isGitInitAndCommit: boolean
    isEnvNeeded: boolean
} = {
    enterNameOrPath: "",
    chooseWhatIfDirectoryNotEmpty: "exit",
    chooseTemplate: "no-database",
    isRealTimePbNeeded: false,
    chooseSvelteKitAdapter: "@sveltejs/adapter-auto",
    isSimpleScaffold: false,
    isGitInitAndCommit: true,
    isEnvNeeded: false,
}

const { version }: { version: string } = await readJson(
    join(uaCwd, "package.json"),
)

const prompter = await createPrompter()
const spinner = prompter.createSpinner()

prompter.insertIntro(`Welcome (v${version})`)

if (!isUaNode && !isUaPnpm) {
    prompter.exit("Only PNPM is supported.")
}

prompts.enterNameOrPath = await prompter.addTextPrompt({
    message: "Name / Path",
    placeholder: "Hit Enter to use the current directory.",
})

const appCwd = join(process.cwd(), prompts.enterNameOrPath)

const PROMPT_DIRECTORY_NOT_EMPTY_OPTIONS = [
    { label: "Exit", value: "exit" },
    {
        label: "Delete and Continue!",
        value: "delete",
        hint: "This will delete the directory and all its contents.",
    },
] as const satisfies RadioPromptOptions

if (exists(appCwd)) {
    const projectDirFiles = await readDir(appCwd)

    if (projectDirFiles.length) {
        prompts.chooseWhatIfDirectoryNotEmpty = await prompter.addRadioPrompt({
            message: "Directory Not Empty",
            options: PROMPT_DIRECTORY_NOT_EMPTY_OPTIONS,
        })

        if (prompts.chooseWhatIfDirectoryNotEmpty === "exit") {
            prompter.exit("Exited.")
        } else if (prompts.chooseWhatIfDirectoryNotEmpty === "delete") {
            const areYouSure = await prompter.addConfirmPrompt({
                message: `Delete ${appCwd}`,
                initialValue: false,
            })

            if (!areYouSure) {
                prompter.exit("Exited.")
            }

            spinner.start("Deleting project")
            await removeDir(appCwd)
            spinner.stop("Project deleted.")
        }
    }
}

const PROMPT_CHOOSE_TEMPLATE_OPTIONS = [
    {
        label: "No Database",
        value: "no-database",
    },
    {
        label: "With Database",
        value: "with-database",
    },
] as const satisfies RadioPromptOptions

prompts.chooseTemplate = await prompter.addRadioPrompt({
    message: "Template",
    options: PROMPT_CHOOSE_TEMPLATE_OPTIONS,
})

const clientCwd =
    prompts.chooseTemplate === "no-database" ? appCwd : join(appCwd, "client")

if (prompts.chooseTemplate === "no-database") {
    prompts.isEnvNeeded = await prompter.addConfirmPrompt({
        message: "Environment Variables?",
        initialValue: prompts.isEnvNeeded,
    })
}

if (prompts.chooseTemplate === "with-database") {
    prompts.isRealTimePbNeeded = await prompter.addConfirmPrompt({
        message: "Setup PocketBase for real-time features?",
        initialValue: prompts.isRealTimePbNeeded,
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
    message: "Simple scaffold?",
    initialValue: prompts.isSimpleScaffold,
})

if (prompts.enterNameOrPath !== "") {
    await makeDir(appCwd)
}

await copyDir(join(uaCwd, "templates", "SvelteKit"), clientCwd, {
    recursive: true,
})

// These files are prefix because they are ignored by the NPM registry. https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files
await rename(join(clientCwd, "..gitignore"), join(clientCwd, ".gitignore"))
await rename(join(clientCwd, "..npmrc"), join(clientCwd, ".npmrc"))

if (
    prompts.chooseTemplate === "with-database" ||
    (prompts.chooseTemplate === "no-database" && prompts.isEnvNeeded)
) {
    await editFile(join(clientCwd, ".gitignore"), (content) =>
        appendLines(content, "/.svelte-kit/", [
            "/.env",
            "/.env.*",
            "!/.env.example",
        ]),
    )
}

if (prompts.chooseTemplate === "no-database" && prompts.isEnvNeeded) {
    await writeFile(join(clientCwd, ".env"), "")
    await writeFile(join(clientCwd, ".env.example"), "")
}

if (prompts.chooseTemplate === "with-database") {
    await copyDir(join(uaCwd, "templates", "PocketBase Client"), clientCwd, {
        recursive: true,
    })

    // ---

    const envPublicPrefix = prompts.isRealTimePbNeeded ? "PUBLIC_" : ""

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

    await copyDir(join(uaCwd, "templates", "PocketBase"), appCwd, {
        recursive: true,
    })

    // --- Download PocketBase Executable

    spinner.start("Fetching PocketBase latest release assets")
    const pbReleases = await getLatestReleaseAssets()
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
        prompts.isRealTimePbNeeded ? "" : "server",
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
            uaCwd,
            "templates",
            "SvelteKit Simple Scaffold",
            "tailwind.config.ts",
        ),
        join(clientCwd, "tailwind.config.ts"),
    )
    await copyFile(
        join(
            uaCwd,
            "templates",
            "SvelteKit Simple Scaffold",
            "src",
            "app.html",
        ),
        join(clientCwd, "src", "app.html"),
    )
    await copyFile(
        join(
            uaCwd,
            "templates",
            "SvelteKit Simple Scaffold",
            "src",
            "error.html",
        ),
        join(clientCwd, "src", "error.html"),
    )
    await copyFile(
        join(
            uaCwd,
            "templates",
            "SvelteKit Simple Scaffold",
            "src",
            "lib",
            "app.css",
        ),
        join(clientCwd, "src", "lib", "app.css"),
    )
    await copyDir(
        join(uaCwd, "templates", "SvelteKit Simple Scaffold", "static"),
        join(clientCwd, "static"),
        { recursive: true },
    )
}

try {
    spinner.start("Installing dependencies")

    const commands = [`cd ${clientCwd}`, "pnpm up --latest"]

    if (prompts.chooseTemplate === "with-database") {
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
