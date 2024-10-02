import {
    cancel,
    confirm,
    intro,
    isCancel,
    outro,
    select,
    text,
} from "@clack/prompts"
import { createSpinner } from "./spinner.js"

export type RadioPromptOptions = {
    label: string
    value: string
    hint?: string
}[]

export const createPrompter = async () => {
    const DEFAULT_CANCEL_MESSAGE = "Cancelled."

    let countInsertedIntro = 0
    let countInsertedOutro = 0

    const insertIntro = (message: string, clear = false) => {
        if (countInsertedIntro > 1) {
            throw new Error("Only one intro can be inserted.")
        }

        if (clear) {
            console.clear()
        } else {
            console.log() // Intentionally left blank line.
        }

        intro(message)
    }

    const insertOutro = (message: string) => {
        if (countInsertedOutro > 1) {
            throw new Error("Only one outro can be inserted.")
        }

        outro(message)
    }

    /**
     * @param code - Use any number above `0` to show the message as an error.
     */
    const insertMessage = (message: string, code?: 0 | number) => {
        const instance = createSpinner()
        instance.start("")
        instance.stop(message, code)
    }

    const addTextPrompt = async (options: {
        message: string
        placeholder?: string
        cancelMessage?: string
    }) => {
        const input = await text({
            message: options.message,
            placeholder: options.placeholder,
        })

        if (isCancel(input)) {
            cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return (input ?? "").trim()
        }
    }

    const addConfirmPrompt = async (options: {
        message: string
        initialValue?: boolean
        cancelMessage?: string
    }) => {
        const input = await confirm({
            message: options.message,
            initialValue: options.initialValue,
        })

        if (isCancel(input)) {
            cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return input
        }
    }

    const addRadioPrompt = async <
        T_Options extends RadioPromptOptions,
    >(options: {
        message: string
        options: T_Options
        cancelMessage?: string
    }) => {
        const input = await select({
            message: options.message,
            options: options.options,
        })

        if (isCancel(input)) {
            cancel(options.cancelMessage || DEFAULT_CANCEL_MESSAGE)
            process.exit()
        } else {
            return input as T_Options[number]["value"]
        }
    }

    const exit = (message: string) => {
        cancel(message)
        process.exit()
    }

    return {
        insertIntro,
        insertOutro,
        insertMessage,
        addTextPrompt,
        addConfirmPrompt,
        addRadioPrompt,
        exit,
    }
}
