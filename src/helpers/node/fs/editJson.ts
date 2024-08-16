import { readJson, writeJson } from "./index.js"

export const editJson = async (path: string, callback: (json: any) => any) => {
    const json = await readJson(path)
    const newJson = callback(json)
    await writeJson(path, newJson)
}
