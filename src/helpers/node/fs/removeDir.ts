import { removeEmptyDir, removeEntries } from "./index.js"

export const removeDir = async (path: string) => {
    await removeEntries(path, { recursive: true })
    await removeEmptyDir(path)
}
