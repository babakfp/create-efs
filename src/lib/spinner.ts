import loading from "loading-cli"
import cliSpinners from "cli-spinners"

export const createSpinner = (text: string) => {
    const newSpinner = loading({
        text,
        ...cliSpinners.dots,
    })

    return {
        start: () => newSpinner.start(),
        stop: () => newSpinner.stop(),
    }
}
