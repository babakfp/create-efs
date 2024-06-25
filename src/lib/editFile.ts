import { readFile, writeFile } from "node:fs/promises"

export const editFile = async (
    path: string,
    callback: (content: string) => string,
) => {
    const content = await readFile(path, { encoding: "utf-8" })

    const newContent = callback(content)

    await writeFile(path, newContent)
}
