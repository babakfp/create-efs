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
import { execSync } from "node:child_process"
import { input, select, confirm } from "@inquirer/prompts"
import { Option, program } from "commander"
import { Downloader } from "nodejs-file-downloader"
import StreamZip from "node-stream-zip"
import { getLatestReleaseAssets } from "./lib/getLatestReleaseAssets.js"
import pkg from "../package.json" with { type: "json" }

const isRunningFromNpmRegistry = !!process.env.npm_config_user_agent

const rootPath = isRunningFromNpmRegistry
    ? join(import.meta.dirname, "..")
    : process.cwd()

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version, "-v, --version")

    .option("--name [name]")
    .addOption(
        new Option("--directory-not-empty [directory-not-empty]").choices([
            "exit",
            "ignore",
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

    .helpOption("-h, --help", "Display help for command.")

    .parse()

const cliOptions = program.opts<{
    name?: string
    directoryNotEmpty?: "exit" | "ignore" | "delete"
    template?: "no-database" | "with-database"
    realtime?: boolean
    adapter?: "auto" | "node" | "static" | "vercel" | "netlify"
    install?: boolean
}>()

const prompts = {
    name: "",
    directoryNotEmpty: "",
    template: "",
    realtime: false,
    adapter: "",
    install: true,
}

const ADAPTER_VERSIONS = {
    "@sveltejs/adapter-auto": "3.2.1",
    "@sveltejs/adapter-node": "5.0.1",
    "@sveltejs/adapter-static": "3.0.1",
    "@sveltejs/adapter-vercel": "5.3.1",
    "@sveltejs/adapter-netlify": "4.2.0",
}

if (cliOptions.name) {
    prompts.name = cliOptions.name
} else {
    prompts.name = await input({
        message: "Name / Path",
        default: "easy-stack-app",
    })
}

prompts.name = prompts.name.trim()

if (prompts.name === "") {
    console.log("Project will be created in the current directory.")
}

const projectPath = join(process.cwd(), prompts.name)

if (existsSync(projectPath)) {
    const projectDirFiles = await readdir(projectPath)

    if (projectDirFiles.length) {
        if (cliOptions.directoryNotEmpty) {
            prompts.directoryNotEmpty = cliOptions.directoryNotEmpty
        } else {
            prompts.directoryNotEmpty = await select({
                message: "Directory NOT Empty",
                choices: [
                    {
                        name: "Exit",
                        value: "exit",
                    },
                    {
                        name: "Ignore",
                        value: "ignore",
                    },
                    {
                        name: "Delete All",
                        value: "delete",
                    },
                ],
                theme: { icon: { cursor: "|" } },
            })
        }

        if (prompts.directoryNotEmpty === "exit") {
            console.log("Exiting without creating a project.")
            process.exit()
        }

        if (prompts.directoryNotEmpty === "delete") {
            console.log(
                "Deleting all files and folders in the current directory.",
            )

            await rm(projectPath, { recursive: true })
            await mkdir(projectPath)
        }
    }
}

if (cliOptions.template) {
    prompts.template = cliOptions.template
} else {
    prompts.template = await select({
        message: "Template",
        choices: [
            {
                name: "No Database",
                value: "no-database",
            },
            {
                name: "With Database",
                value: "with-database",
            },
        ],
        theme: { icon: { cursor: "|" } },
    })
}

if (prompts.template === "with-database") {
    if (cliOptions.realtime !== undefined) {
        prompts.realtime = cliOptions.realtime
    } else {
        prompts.realtime = await confirm({
            message: "Will you use real-time database features?",
            default: prompts.realtime,
        })
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
    prompts.adapter = await select({
        message: "Adapter",
        choices: [
            {
                name: "Auto",
                value: "@sveltejs/adapter-auto",
            },
            {
                name: "Node",
                value: "@sveltejs/adapter-node",
            },
            {
                name: "Static",
                value: "@sveltejs/adapter-static",
            },
            {
                name: "Vercel",
                value: "@sveltejs/adapter-vercel",
            },
            {
                name: "Netlify",
                value: "@sveltejs/adapter-netlify",
            },
        ],
        theme: { icon: { cursor: "|" } },
    })
}

// Copy SvelteKit template

const projectClientPath =
    prompts.template === "no-database"
        ? projectPath
        : join(projectPath, "client")

await cp(join(rootPath, "templates", "SvelteKit"), projectClientPath, {
    recursive: true,
})

// I needed to prefix these files because they were being ignored by the NPM registery.
// https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files

await rename(
    join(projectClientPath, "..gitignore"),
    join(projectClientPath, ".gitignore"),
)
await rename(
    join(projectClientPath, "..npmrc"),
    join(projectClientPath, ".npmrc"),
)

if (prompts.template === "with-database") {
    const updateGitIgnoreFile = async () => {
        const path = join(projectClientPath, ".gitignore")
        const oldContent = await readFile(path, {
            encoding: "utf-8",
        })

        const newContent = oldContent.replace(
            "/.svelte-kit/",
            ["/.svelte-kit/", "/.env", "/.env.*", "/!.env.example"].join("\n"),
        )

        await writeFile(path, newContent)
    }

    updateGitIgnoreFile()
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
        const selectedAsset = await select({
            message: "Choose an Asset",
            choices: assets.map((asset) => ({
                name: asset.name,
                value: asset.name,
            })),
            theme: { icon: { cursor: "|" } },
        })

        const downloadUrl = assets.filter(
            (asset) => asset.name === selectedAsset,
        )[0].downloadUrl

        const downloader = new Downloader({
            url: downloadUrl,
            directory: join(projectPath, "storage"),
        })

        try {
            await downloader.download()
        } catch (error) {
            console.log(
                "Download failed. Download it yourself https://github.com/pocketbase/pocketbase/releases/latest",
                error,
            )
        }

        const zip = new StreamZip.async({
            file: join(projectPath, "storage", selectedAsset),
        })
        await zip.extract(null, join(projectPath, "storage"))
        await zip.close()

        await rm(join(projectPath, "storage", selectedAsset))
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
    prompts.install = await confirm({
        message: "Install Dependencies",
        default: prompts.install,
    })
}

if (prompts.install) {
    const command = [`cd ${projectClientPath}`, "pnpm i"].join(" && ")

    console.log("Installing dependencies...")

    execSync(command)
}
