import { arch } from "node:os"

type GitHubPocketBaseRelease = {
    assets: {
        name: string
        browser_download_url: string
    }[]
}

export const fetchPbLatestReleaseAssets = async () => {
    const res = await fetch(
        "https://api.github.com/repos/pocketbase/pocketbase/releases/latest",
    )
    const data: GitHubPocketBaseRelease = await res.json()

    const assets = data.assets
        .filter((asset) => asset.name.endsWith(".zip"))
        .filter((asset) => {
            if (process.platform === "win32") {
                return asset.name.includes("windows")
            } else if (process.platform === "darwin") {
                return asset.name.includes("darwin")
            } else if (process.platform === "linux") {
                return asset.name.includes("linux")
            }

            return true
        })
        .filter((asset) => {
            if (arch() === "x64" || arch() === "ia32") {
                return asset.name.includes("amd64")
            } else if (arch() === "arm64" || arch() === "arm") {
                return asset.name.includes("arm64")
            }

            return true
        })
        .map((asset) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url,
        }))

    return assets
}
