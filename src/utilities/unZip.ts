import { rm } from "node:fs/promises"
import { dirname } from "node:path"
import StreamZip from "node-stream-zip"

export const unZip = async (path: string) => {
    const zip = new StreamZip.async({
        file: path,
    })

    await zip.extract(null, dirname(path))

    await zip.close()

    await rm(path)
}
