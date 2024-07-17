import { remove } from "./index.js"

export const removeDir = async (path: string) => {
    await remove(path, { recursive: true })
}
