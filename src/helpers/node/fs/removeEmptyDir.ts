import { rmdir } from "node:fs/promises"

export const removeEmptyDir = async (path: string) => {
    await rmdir(path)
}
