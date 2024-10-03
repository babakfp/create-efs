import type { CopyOptions } from "node:fs"
import { cp } from "node:fs/promises"

/**
 * Asynchronously copies the entire directory structure, including
 * subdirectories and files.
 *
 * @return Fulfills with `undefined` upon success.
 */
export const copyDir = async (
    from: string | URL,
    to: string | URL,
    options?: Omit<CopyOptions, "recursive">,
) => {
    return await cp(from, to, {
        ...options,
        recursive: true,
    })
}
