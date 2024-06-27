import { exec, type ExecException } from "node:child_process"
import { existsSync } from "node:fs"
import {
    cp,
    mkdir,
    readdir,
    readFile,
    rename,
    rm,
    writeFile,
} from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"
import { Downloader } from "nodejs-file-downloader"
import { editFile } from "./lib/editFile.js"
import { getLatestReleaseAssets } from "./lib/getLatestReleaseAssets.js"
import { createPrompter, createSpinner } from "./lib/prompts.js"
import { unZip } from "./lib/unZip.js"

const prompter = await createPrompter()

const execAsync = promisify(exec)

const isRunningFromNpmRegistry = !!process.env.npm_config_user_agent

const rootPath = isRunningFromNpmRegistry
    ? join(import.meta.dirname, "..")
    : process.cwd()

const prompts = {
    enterNameOrPath: "",
    chooseWhatIfDirectoryNotEmpty: "",
    chooseTemplate: "",
    isRealTimePbNeeded: false,
    chooseSvelteKitAdapter: "",
    isInstallDependencies: true,
    isGitInitAndCommit: true,
    isEnvNeeded: true,
}

const ADAPTER_VERSIONS = {
    "@sveltejs/adapter-auto": "3.2.1",
    "@sveltejs/adapter-node": "5.0.1",
    "@sveltejs/adapter-static": "3.0.1",
    "@sveltejs/adapter-vercel": "5.3.1",
    "@sveltejs/adapter-netlify": "4.2.0",
}

prompter.insertIntro("Welcome")

prompts.enterNameOrPath = await prompter.addTextPrompt({
    message: "Name / Path",
    placeholder: "Hit Enter to use the current directory.",
})

const projectPath = join(process.cwd(), prompts.enterNameOrPath)

if (existsSync(projectPath)) {
    const projectDirFiles = await readdir(projectPath)

    if (projectDirFiles.length) {
        prompts.chooseWhatIfDirectoryNotEmpty = await prompter.addRadioPrompt({
            message: "Directory Not Empty",
            options: [
                { label: "Exit", value: "exit" },
                { label: "Delete!", value: "delete" },
            ],
        })

        if (prompts.chooseWhatIfDirectoryNotEmpty === "exit") {
            prompter.exit("Exited.")
        }

        if (prompts.chooseWhatIfDirectoryNotEmpty === "delete") {
            const deleteSpinner = createSpinner()
            deleteSpinner.start("Deleting project")

            await rm(projectPath, { recursive: true })
            await mkdir(projectPath)

            deleteSpinner.stop("Project deleted.")
        }
    }
}

prompts.chooseTemplate = await prompter.addRadioPrompt({
    message: "Template",
    options: [
        {
            label: "No Database",
            value: "no-database",
        },
        {
            label: "With Database",
            value: "with-database",
        },
    ],
})

if (prompts.chooseTemplate === "no-database") {
    prompts.isEnvNeeded = await prompter.addConfirmPrompt({
        message: "Are you going to use Environment Variables?",
        initialValue: prompts.isEnvNeeded,
    })
}

if (prompts.chooseTemplate === "with-database") {
    prompts.isRealTimePbNeeded = await prompter.addConfirmPrompt({
        message: "Will you use real-time database features?",
        initialValue: prompts.isRealTimePbNeeded,
    })
}

prompts.chooseSvelteKitAdapter = await prompter.addRadioPrompt({
    message: "Adapter",
    options: [
        {
            label: "Auto",
            value: "@sveltejs/adapter-auto",
        },
        {
            label: "Node",
            value: "@sveltejs/adapter-node",
        },
        {
            label: "Static",
            value: "@sveltejs/adapter-static",
        },
        {
            label: "Vercel",
            value: "@sveltejs/adapter-vercel",
        },
        {
            label: "Netlify",
            value: "@sveltejs/adapter-netlify",
        },
    ],
})

// Copy SvelteKit template

const projectClientPath =
    prompts.chooseTemplate === "no-database"
        ? projectPath
        : join(projectPath, "client")

await cp(join(rootPath, "templates", "SvelteKit"), projectClientPath, {
    recursive: true,
})

// I needed to prefix these files because they were being ignored by the NPM registry.
// https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files

await rename(
    join(projectClientPath, "..gitignore"),
    join(projectClientPath, ".gitignore"),
)
await rename(
    join(projectClientPath, "..npmrc"),
    join(projectClientPath, ".npmrc"),
)

if (
    prompts.chooseTemplate === "with-database" ||
    (prompts.chooseTemplate === "no-database" && prompts.isEnvNeeded)
) {
    const path = join(projectClientPath, ".gitignore")
    const oldContent = await readFile(path, {
        encoding: "utf-8",
    })

    const newContent = oldContent.replace(
        "/.svelte-kit/",
        ["/.svelte-kit/", "/.env", "/.env.*", "!/.env.example"].join("\n"),
    )

    await writeFile(path, newContent)
}

if (prompts.chooseTemplate === "no-database" && prompts.isEnvNeeded) {
    await writeFile(join(projectClientPath, ".env"), "")
    await writeFile(join(projectClientPath, ".env.example"), "")
}

if (prompts.chooseTemplate === "with-database") {
    await cp(
        join(rootPath, "templates", "PocketBase Client"),
        projectClientPath,
        { recursive: true },
    )

    // ---

    const envPublicPrefix = prompts.isRealTimePbNeeded ? "PUBLIC_" : ""

    const getEnvFileContent = async (useDefaultUrl: boolean) => {
        const defaultUrl = "http://127.0.0.1:8090"
        const defaultUrlContent = useDefaultUrl ? defaultUrl : ""

        const content =
            [
                `${envPublicPrefix}PB_URL="${defaultUrlContent}" # Used to connect to DB and PocketBase type generation CLI`,
                `PB_EMAIL="" # Used for PocketBase type generation CLI`,
                `PB_PASSWORD="" # Used for PocketBase type generation CLI`,
            ].join("\n") + "\n"

        return content
    }

    await writeFile(
        join(projectClientPath, ".env"),
        await getEnvFileContent(true),
    )

    await writeFile(
        join(projectClientPath, ".env.example"),
        await getEnvFileContent(false),
    )

    // --- PocketBase

    await cp(join(rootPath, "templates", "PocketBase"), projectPath, {
        recursive: true,
    })

    // --- Download PocketBase Executable

    const assets = await getLatestReleaseAssets()

    if (assets.length) {
        const selectedAsset = await prompter.addRadioPrompt({
            message: "Choose an Asset",
            options: assets.map((asset) => ({
                label: asset.name,
                value: asset.name,
            })),
        })

        await editFile(join(projectPath, "storage", "Dockerfile"), (content) =>
            content.replace(
                "ARG PB_VERSION=0.22.12",
                `ARG PB_VERSION=${selectedAsset.split("_")[1]}`,
            ),
        )

        const downloadUrl = assets.filter(
            (asset) => asset.name === selectedAsset,
        )[0].downloadUrl

        const downloader = new Downloader({
            url: downloadUrl,
            directory: join(projectPath, "storage"),
        })

        let isDownloadSeccessful = false
        const downloadSpinner = createSpinner()

        try {
            downloadSpinner.start("Downloading PocketBase")

            await downloader.download()

            downloadSpinner.stop("PocketBase downloaded.")

            isDownloadSeccessful = true
        } catch (error) {
            downloadSpinner.stop("PocketBase download failed.", 1)
        }

        if (isDownloadSeccessful) {
            await unZip(join(projectPath, "storage", selectedAsset))
        }
    }

    // --- PocketBase Type Generation

    const typeGenOutputPath = join(
        ...[
            "src",
            "lib",
            prompts.isRealTimePbNeeded ? "" : "server",
            "pb",
            "types.ts",
        ],
    )

    const pbTypeGenScript = {
        key: "pb-types",
        value: `pocketbase-auto-generate-types -u ${envPublicPrefix}PB_URL -e PB_EMAIL -p PB_PASSWORD -o ${typeGenOutputPath}`,
    }

    const packageJsonPath = join(projectClientPath, "package.json")
    const packageJsonContent = await readFile(packageJsonPath)

    const newPackageJsonContent = packageJsonContent
        .toString()
        .replace(
            '        "pocketbase": "0.21.2",',
            [
                '        "pocketbase": "0.21.2",',
                '        "pocketbase-auto-generate-types": "1.0.1",',
            ].join("\n"),
        )

    const packageJsonJson = JSON.parse(String(newPackageJsonContent))

    const packageJsonScripts = Object.entries(packageJsonJson.scripts)
    packageJsonScripts.push([pbTypeGenScript.key, pbTypeGenScript.value])
    const newPackageJsonScripts = Object.fromEntries(packageJsonScripts)

    packageJsonJson.scripts = newPackageJsonScripts

    await writeFile(
        packageJsonPath,
        JSON.stringify(packageJsonJson, null, 4) + "\n",
    )
}

// ---

if (prompts.chooseSvelteKitAdapter !== "@sveltejs/adapter-auto") {
    const packageJsonPath = join(projectClientPath, "package.json")
    const packageJsonContent = await readFile(packageJsonPath)
    const packageJsonJson = JSON.parse(String(packageJsonContent))
    packageJsonJson.devDependencies = Object.fromEntries(
        Object.entries(packageJsonJson.devDependencies).map(([key, value]) => {
            if (key === "@sveltejs/adapter-auto") {
                key = prompts.chooseSvelteKitAdapter
                // @ts-expect-error
                value = ADAPTER_VERSIONS[prompts.chooseSvelteKitAdapter]
            }
            return [key, value]
        }),
    )
    await writeFile(
        packageJsonPath,
        JSON.stringify(packageJsonJson, null, 4) + "\n",
    )

    // ---

    const svelteConfigPath = join(projectClientPath, "svelte.config.js")
    const svelteConfigContent = await readFile(svelteConfigPath, {
        encoding: "utf-8",
    })
    await writeFile(
        svelteConfigPath,
        svelteConfigContent.replace(
            "@sveltejs/adapter-auto",
            prompts.chooseSvelteKitAdapter,
        ),
    )

    // ---

    const gitignorePath = join(projectClientPath, ".gitignore")
    const gitignoreContent = await readFile(gitignorePath, {
        encoding: "utf-8",
    })

    const replaceWith = ["/.svelte-kit/"]

    if (
        prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-node" ||
        prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-static"
    ) {
        replaceWith.push("/build/")
    } else if (prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-vercel") {
        replaceWith.push("/.vercel/")
    } else if (prompts.chooseSvelteKitAdapter === "@sveltejs/adapter-netlify") {
        replaceWith.push("/.netlify/")
    }

    await writeFile(
        gitignorePath,
        gitignoreContent.replace("/.svelte-kit/", replaceWith.join("\n")),
    )
}

prompts.isInstallDependencies = await prompter.addConfirmPrompt({
    message: "Install Dependencies",
    initialValue: prompts.isInstallDependencies,
})

prompts.isGitInitAndCommit = await prompter.addConfirmPrompt({
    message: "Use Git?",
    initialValue: prompts.isGitInitAndCommit,
})

if (prompts.isInstallDependencies) {
    const installSpinner = createSpinner()

    try {
        installSpinner.start("Installing dependencies")

        await execAsync(
            [`cd ${projectClientPath}`, "pnpm up --latest"].join(" && "),
        )

        installSpinner.stop("Dependencies installed.")
    } catch (error) {
        installSpinner.stop(
            "Dependency installation failed.",
            (error as ExecException).code,
        )
    }
}

if (prompts.isGitInitAndCommit) {
    const installSpinner = createSpinner()

    try {
        installSpinner.start("Initializing Git")

        await execAsync(
            [
                `cd ${projectClientPath}`,
                "git init",
                "git add .",
                'git commit -m "First commit"',
            ].join(" && "),
        )

        installSpinner.stop("Git initialized.")
    } catch (error) {
        installSpinner.stop(
            "Git initialization failed.",
            (error as ExecException).code,
        )
    }
}

prompter.insertOutro("Your app is ready.")
