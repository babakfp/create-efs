import { writeFile } from "./index.js"

export const writeJson = async (path: string, content: any) => {
    await writeFile(path, JSON.stringify(content, null, 4) + "\n")
}
