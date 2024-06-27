import { readFile as rf } from "node:fs/promises"

export const readFile = async (path: string) => {
    return await rf(path, { encoding: "utf-8" })
}
