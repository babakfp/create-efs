import { readFile, writeFile } from "./index.js"

export const editFile = async (
    path: string,
    callback: (content: string) => string,
) => {
    const content = await readFile(path)

    const newContent = callback(content)

    await writeFile(path, newContent)
}
