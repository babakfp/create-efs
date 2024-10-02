import { spinner } from "@clack/prompts"

export const createSpinner = () => {
    const instance = spinner()

    return {
        start: (message: string) => {
            instance.start(message)
        },
        /**
         * @param code - Use any number above `0` to show the message as an error.
         */
        stop: (message: string, code?: 0 | number) => {
            instance.stop(message, code)
        },
        message: (message: string) => {
            instance.message(message)
        },
    }
}
