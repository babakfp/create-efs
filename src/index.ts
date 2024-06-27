import { join } from "node:path"
import {
    readdir,
    mkdir,
    rm,
    cp,
    readFile,
    writeFile,
    rename,
} from "node:fs/promises"
import { existsSync } from "node:fs"
import { exec } from "node:child_process"
import { Option, program } from "commander"
import { Downloader } from "nodejs-file-downloader"
import { unZip } from "./lib/unZip.js"
import { editFile } from "./lib/editFile.js"
import {
    intro,
    outro,
    text,
    select,
    confirm,
    isCancel,
    cancel,
    spinner,
} from "@clack/prompts"
import { getLatestReleaseAssets } from "./lib/getLatestReleaseAssets.js"

const isRunningFromNpmRegistry = !!process.env.npm_config_user_agent

const rootPath = isRunningFromNpmRegistry
    ? join(import.meta.dirname, "..")
    : process.cwd()

const packageJson = JSON.parse(
    await readFile(join(rootPath, "package.json"), { encoding: "utf-8" }),
)

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version, "-v, --version")

    .option("--name [name]")
    .addOption(
        new Option("--directory-not-empty [directory-not-empty]").choices([
            "exit",
            "delete",
        ]),
    )
    .addOption(
        new Option("--template [template]").choices([
            "no-database",
            "with-database",
        ]),
    )
    .option("--realtime")
    .addOption(
        new Option("--adapter [adapter]").choices([
            "auto",
            "node",
            "static",
            "vercel",
            "netlify",
        ]),
    )
    .option("--install")
    .option("--git")

    .helpOption("-h, --help", "Display help for command.")

    .parse()

const cliOptions = program.opts<{
    name?: string
    directoryNotEmpty?: "exit" | "delete"
    template?: "no-database" | "with-database"
    realtime?: boolean
    adapter?: "auto" | "node" | "static" | "vercel" | "netlify"
    install?: boolean
    git?: boolean
}>()

const prompts = {
    name: "",
    directoryNotEmpty: "",
    template: "",
    realtime: false,
    adapter: "",
    install: true,
    git: true,
    environmentVariables: true,
}

const ADAPTER_VERSIONS = {
    "@sveltejs/adapter-auto": "3.2.1",
    "@sveltejs/adapter-node": "5.0.1",
    "@sveltejs/adapter-static": "3.0.1",
    "@sveltejs/adapter-vercel": "5.3.1",
    "@sveltejs/adapter-netlify": "4.2.0",
}

console.log()
intro("Welcome!")

if (cliOptions.name) {
    prompts.name = cliOptions.name
} else {
    const name = await text({
        message: "Name / Path",
        placeholder: "Hit Enter to use the current directory!",
    })

    if (isCancel(name)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.name = name ?? ""
    }
}

prompts.name = prompts.name.trim()

const projectPath = join(process.cwd(), prompts.name)

if (existsSync(projectPath)) {
    const projectDirFiles = await readdir(projectPath)

    if (projectDirFiles.length) {
        if (cliOptions.directoryNotEmpty) {
            prompts.directoryNotEmpty = cliOptions.directoryNotEmpty
        } else {
            const directoryNotEmpty = (await select({
                message: "Directory NOT Empty",
                options: [
                    {
                        label: "Exit",
                        value: "exit",
                    },
                    {
                        label: "Delete",
                        value: "delete",
                    },
                ],
            })) as "exit" | "delete"

            if (isCancel(directoryNotEmpty)) {
                cancel("Operation cancelled!")
                process.exit()
            } else {
                prompts.directoryNotEmpty = directoryNotEmpty
            }
        }

        if (prompts.directoryNotEmpty === "exit") {
            cancel("Exiting without creating a project!")
            process.exit()
        }

        if (prompts.directoryNotEmpty === "delete") {
            const deleteSpinner = spinner()
            deleteSpinner.start("Deleting project!")

            await rm(projectPath, { recursive: true })
            await mkdir(projectPath)

            deleteSpinner.stop("Deleted project!")
        }
    }
}

if (cliOptions.template) {
    prompts.template = cliOptions.template
} else {
    const template = (await select({
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
    })) as "no-database" | "with-database"

    if (isCancel(template)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.template = template
    }
}

if (prompts.template === "no-database") {
    const environmentVariables = await confirm({
        message: "Are you going to use Environment Variables?",
        initialValue: prompts.environmentVariables,
    })

    if (isCancel(environmentVariables)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.environmentVariables = environmentVariables
    }
}

if (prompts.template === "with-database") {
    if (cliOptions.realtime !== undefined) {
        prompts.realtime = cliOptions.realtime
    } else {
        const realtime = await confirm({
            message: "Will you use real-time database features?",
            initialValue: prompts.realtime,
        })

        if (isCancel(realtime)) {
            cancel("Operation cancelled!")
            process.exit()
        } else {
            prompts.realtime = realtime
        }
    }
}

if (cliOptions.adapter) {
    const mapCliAdapterToPromptAdapter = {
        auto: "@sveltejs/adapter-auto",
        node: "@sveltejs/adapter-node",
        static: "@sveltejs/adapter-static",
        vercel: "@sveltejs/adapter-vercel",
        netlify: "@sveltejs/adapter-netlify",
    }

    prompts.adapter = mapCliAdapterToPromptAdapter[cliOptions.adapter]
} else {
    const adapter = (await select({
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
    })) as
        | "@sveltejs/adapter-auto"
        | "@sveltejs/adapter-node"
        | "@sveltejs/adapter-static"
        | "@sveltejs/adapter-vercel"
        | "@sveltejs/adapter-netlify"

    if (isCancel(adapter)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.adapter = adapter
    }
}

// Copy SvelteKit template

const projectClientPath =
    prompts.template === "no-database"
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
    prompts.template === "with-database" ||
    (prompts.template === "no-database" && prompts.environmentVariables)
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

if (prompts.template === "no-database" && prompts.environmentVariables) {
    await writeFile(join(projectClientPath, ".env"), "")
    await writeFile(join(projectClientPath, ".env.example"), "")
}

if (prompts.template === "with-database") {
    await cp(
        join(rootPath, "templates", "PocketBase Client"),
        projectClientPath,
        { recursive: true },
    )

    // ---

    const envPublicPrefix = prompts.realtime ? "PUBLIC_" : ""

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
        const selectedAsset = (await select({
            message: "Choose an Asset",
            options: assets.map((asset) => ({
                label: asset.name,
                value: asset.name,
            })),
        })) as string

        if (isCancel(selectedAsset)) {
            cancel("Operation cancelled!")
            process.exit()
        }

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
        const downloadSpinner = spinner()

        try {
            downloadSpinner.start("Downloading PocketBase")

            await downloader.download()

            downloadSpinner.stop("Downloaded PocketBase!")

            isDownloadSeccessful = true
        } catch (error) {
            downloadSpinner.stop("Failed to download PocketBase!", 1)
        }

        if (isDownloadSeccessful) {
            await unZip(join(projectPath, "storage", selectedAsset))
        }
    }

    // --- PocketBase Type Generation

    const typeGenOutputPath = join(
        ...["src", "lib", prompts.realtime ? "" : "server", "pb", "types.ts"],
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

if (prompts.adapter !== "@sveltejs/adapter-auto") {
    const packageJsonPath = join(projectClientPath, "package.json")
    const packageJsonContent = await readFile(packageJsonPath)
    const packageJsonJson = JSON.parse(String(packageJsonContent))
    packageJsonJson.devDependencies = Object.fromEntries(
        Object.entries(packageJsonJson.devDependencies).map(([key, value]) => {
            if (key === "@sveltejs/adapter-auto") {
                key = prompts.adapter
                // @ts-expect-error
                value = ADAPTER_VERSIONS[prompts.adapter]
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
        svelteConfigContent.replace("@sveltejs/adapter-auto", prompts.adapter),
    )

    // ---

    const gitignorePath = join(projectClientPath, ".gitignore")
    const gitignoreContent = await readFile(gitignorePath, {
        encoding: "utf-8",
    })

    const replaceWith = ["/.svelte-kit/"]

    if (
        prompts.adapter === "@sveltejs/adapter-node" ||
        prompts.adapter === "@sveltejs/adapter-static"
    ) {
        replaceWith.push("/build/")
    } else if (prompts.adapter === "@sveltejs/adapter-vercel") {
        replaceWith.push("/.vercel/")
    } else if (prompts.adapter === "@sveltejs/adapter-netlify") {
        replaceWith.push("/.netlify/")
    }

    await writeFile(
        gitignorePath,
        gitignoreContent.replace("/.svelte-kit/", replaceWith.join("\n")),
    )
}

if (cliOptions.install !== undefined) {
    prompts.install = cliOptions.install
} else {
    const install = await confirm({
        message: "Install Dependencies",
        initialValue: prompts.install,
    })

    if (isCancel(install)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.install = install
    }
}

if (cliOptions.git !== undefined) {
    prompts.git = cliOptions.git
} else {
    const git = await confirm({
        message: "Use Git?",
        initialValue: prompts.git,
    })

    if (isCancel(git)) {
        cancel("Operation cancelled!")
        process.exit()
    } else {
        prompts.git = git
    }
}

if (prompts.install) {
    const installSpinner = spinner()
    installSpinner.start("Installing dependencies")

    const command = [`cd ${projectClientPath}`, "pnpm up --latest"].join(" && ")

    exec(command, (error) => {
        if (error?.code) {
            installSpinner.stop("Failed to install dependencies!", error.code)
        } else {
            installSpinner.stop("Installed dependencies!")
        }
    })
}

if (prompts.git) {
    const installSpinner = spinner()
    installSpinner.start("Initializing Git")

    const command = [
        `cd ${projectClientPath}`,
        "git init",
        "git add .",
        "git commit -m 'First commit'",
    ].join(" && ")

    exec(command, (error) => {
        if (error?.code) {
            installSpinner.stop("Failed to initialized Git!", error.code)
        } else {
            installSpinner.stop("Initialized Git!")
        }
    })
}

outro("Your app is ready!")
