import { dummyLatestReleaseData } from "./dummyLatestReleaseData.js"

export const getLatestReleaseAssets = async (useDummyData = false) => {
    let data = dummyLatestReleaseData

    if (!useDummyData) {
        const res = await fetch(
            "https://api.github.com/repos/pocketbase/pocketbase/releases/latest",
        )
        data = await res.json()
    }

    const assets = data.assets
        .slice(1)
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
        .map((asset) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url,
        }))

    return assets
}
