import * as p from "@clack/prompts"

type RadioOptions = {
    label: string
    value: string
    hint?: string
}[]

export const createPrompter = async () => {
    const DEFAULT_CANCEL_MESSAGE = "Cancelled."

    let countInsertedIntro = 0
    let countInsertedOutro = 0

    const intro = (message: string, clear = false) => {
        if (countInsertedIntro > 1) {
            throw new Error("Only one intro can be inserted.")
        }

        if (clear) {
            console.clear()
        } else {
            console.log()
        }

        p.intro(message)
    }

    const outro = (message: string) => {
        if (countInsertedOutro > 1) {
            throw new Error("Only one outro can be inserted.")
        }

        p.outro(message)
    }

    const text = async (options: {
        message: string
        placeholder?: string
        cancelMessage?: string
    }) => {
        const input = await p.text({
            message: options.message,
            placeholder: options.placeholder,
        })

        if (p.isCancel(input)) {
            p.cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return (input ?? "").trim()
        }
    }

    const confirm = async (options: {
        message: string
        initialValue?: boolean
        cancelMessage?: string
    }) => {
        const input = await p.confirm({
            message: options.message,
            initialValue: options.initialValue,
        })

        if (p.isCancel(input)) {
            p.cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return input
        }
    }

    const radio = async <T_Options extends RadioOptions>(options: {
        message: string
        options: T_Options
        cancelMessage?: string
    }) => {
        const input = await p.select({
            message: options.message,
            options: options.options,
        })

        if (p.isCancel(input)) {
            p.cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return input as T_Options[number]["value"]
        }
    }

    const exit = (message: string) => {
        p.cancel(message)
        process.exit()
    }

    const note = p.note

    return { intro, outro, text, confirm, radio, exit, note }
}
