import { pbDummyLatestRelease } from "./pbDummyLatestRelease.js"

export const fetchPbLatestRelease = async (useDummyData = false) => {
    if (useDummyData) {
        return pbDummyLatestRelease
    }

    const res = await fetch(
        "https://api.github.com/repos/pocketbase/pocketbase/releases/latest",
    )
    const data: typeof pbDummyLatestRelease = await res.json()

    return data
}
