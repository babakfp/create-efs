import { readFile } from "./index.js"

export const readJson = async (path: string) => {
    return JSON.parse(await readFile(path))
}
