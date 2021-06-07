import { fireEvent, render, screen } from "@testing-library/svelte"
import userEvent from "@testing-library/user-event"
import Game from "./Game.svelte"

describe("file Game.svelte", () => {
  const getSetupForm = () => screen.getByRole("form", { name: "setup" })
  const getStartButton = () =>
    screen.getByRole("button", { name: "Start Game" })
  const getColumnInput = () =>
    screen.getByRole("spinbutton", { name: "Columns:" })
  const getRowInput = () => screen.getByRole("spinbutton", { name: "Rows:" })

  const getFields = () =>
    screen.getAllByRole("button", { name: "field" }) as HTMLButtonElement[]
  const queryFields = () => screen.queryAllByRole("button", { name: "field" })

  const getBombInput = () => screen.getByRole("spinbutton", { name: "Bombs:" })

  it("does not show a Gameboard on opening the app", () => {
    expect.hasAssertions()
    render(Game)

    const fields = queryFields()

    expect(fields[0]).toBeUndefined()
  })

  describe("setup form", () => {
    describe("start game button", () => {
      it("is visible on opening the app", () => {
        expect.hasAssertions()
        render(Game)
        const button = screen.getByRole("button", { name: "Start Game" })

        expect(button).toBeInTheDocument()
      })

      it("does render a gameboard on click", async () => {
        expect.hasAssertions()
        render(Game)
        const button = screen.getByRole("button", { name: "Start Game" })

        await userEvent.click(button)

        const fields = getFields()

        expect(fields[0]).toBeInTheDocument()
      })

      it("is no longer visible after game has started", async () => {
        expect.hasAssertions()
        render(Game)
        const button = getStartButton()
        const form = getSetupForm()

        await userEvent.click(button)

        expect(form).not.toBeInTheDocument()
      })

      it("does preventDefault on click", async () => {
        expect.hasAssertions()
        render(Game)
        const button = screen.getByRole("button", { name: "Start Game" })

        const prevented = await fireEvent.click(button)

        expect(prevented).toBeFalsy()
      })
    })

    describe("size inputs", () => {
      it("has input fields for setting the width and height on first start that have default values of 10", () => {
        expect.hasAssertions()
        render(Game)

        const columnInput = getColumnInput()
        expect(columnInput).toHaveValue(10)

        const rowInput = getRowInput()
        expect(rowInput).toHaveValue(10)
      })

      it("has a minimum value of 1", async () => {
        expect.hasAssertions()
        render(Game)

        const columnInput = getColumnInput()
        const rowInput = getRowInput()
        await userEvent.clear(columnInput)
        await userEvent.type(columnInput, "-1")
        await userEvent.clear(rowInput)
        await userEvent.type(rowInput, "0")

        // because of a bug, changes on inputs dont trigger a change event
        // https://github.com/testing-library/user-event/issues/682
        await fireEvent.change(rowInput)

        expect(columnInput).toHaveValue(1)
        expect(rowInput).toHaveValue(1)
      })

      it("starts a game with the correct number of fields", async () => {
        expect.hasAssertions()
        render(Game)

        const columnInput = getColumnInput()
        const rowInput = getRowInput()
        const button = getStartButton()

        await userEvent.clear(columnInput)
        await userEvent.type(columnInput, "15")
        await userEvent.clear(rowInput)
        await userEvent.type(rowInput, "15")
        await userEvent.click(button)

        const fields = getFields()

        expect(fields).toHaveLength(15 * 15)
      })

      describe("bomb input", () => {
        it("has an input field that sets the number of bombs and has a default value of 10", () => {
          expect.hasAssertions()
          render(Game)

          const bombInput = getBombInput()

          expect(bombInput).toHaveValue(10)
        })

        it("has a minimum value of 1 and a maximum value of half the available fields", async () => {
          expect.hasAssertions()
          render(Game)

          const bombInput = getBombInput()
          const rowInput = getRowInput()

          await userEvent.clear(bombInput)
          await userEvent.type(bombInput, "0")
          await userEvent.click(rowInput)
          await userEvent.clear(rowInput)
          await userEvent.type(rowInput, "20")
          await fireEvent.change(rowInput)

          expect(bombInput).toHaveValue(1)

          await userEvent.clear(bombInput)
          await userEvent.type(bombInput, "999")
          await userEvent.click(rowInput)
          await fireEvent.change(bombInput)

          expect(bombInput).toHaveValue((20 * 10) / 2)

          await userEvent.clear(rowInput)
          await userEvent.type(rowInput, "10")
          await userEvent.click(bombInput)
          await fireEvent.change(bombInput)

          expect(bombInput).toHaveValue((10 * 10) / 2)
        })

        it("starts the game with the correct number of bombs", async () => {
          expect.hasAssertions()
          render(Game)
          const bombInput = getBombInput()
          const button = getStartButton()

          await userEvent.clear(bombInput)
          await userEvent.type(bombInput, "15")
          await userEvent.click(button)

          const fields = getFields()

          let bombCounter = 0

          await fields.forEach(async (field) => {
            if (!field.disabled) {
              await userEvent.click(field)
            }

            if (field.classList.contains("bomb")) bombCounter++
          })

          expect(bombCounter).toBe(15)
        })
      })
    })
  })

  describe("new game button", () => {
    const getNewGameButton = () =>
      screen.getByRole("button", { name: "New Game" })

    it("is only visible after the game starts", async () => {
      expect.hasAssertions()
      render(Game)

      let newGameButton = screen.queryByRole("button", { name: "New Game" })
      expect(newGameButton).not.toBeInTheDocument()

      const startButton = getStartButton()
      await userEvent.click(startButton)

      newGameButton = getNewGameButton()
      expect(newGameButton).toBeInTheDocument()
    })

    it("does bring back the setup-form and removes itself and the gameboard", async () => {
      expect.hasAssertions()
      render(Game)

      const startButton = getStartButton()
      await userEvent.click(startButton)

      const newGameButton = getNewGameButton()
      const field = getFields()[0]
      await userEvent.click(newGameButton)

      expect(field).not.toBeInTheDocument()
      expect(newGameButton).not.toBeInTheDocument()

      const form = screen.getByRole("form", { name: "setup" })
      expect(form).toBeInTheDocument()
    })
  })
})
