import { expect, test } from 'claude-code/testing'

const props = {
  hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 8 }, view: {},
}
const viewport = { columns: 100, rows: 30 }

test('the button rewrites the draft into the prompt box, and Undo restores it', async ($, on) => {
  const filled: string[] = []
  on('prompt.read', () => ({ value: { text: 'make calc better pls', cursor: 0 } }))
  on('model.complete', () => ({
    value: {
      isAnswered: true,
      text: 'Improve the macro calculator: list three concrete UX fixes.',
      usage: { input_tokens: 1, output_tokens: 1 },
    },
  }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true, text: e.text, cursor: e.text.length }
  })

  const ui = await $.ui.mount({ plugin: 'prompt-master', surface: 'desktop', component: 'AbovePrompt', props, viewport })
  await ui.press({ key: 'prompt-master' })
  expect(filled).toEqual(['Improve the macro calculator: list three concrete UX fixes.'])
  await ui.press({ key: 'undo' })
  expect(filled[1]).toBe('make calc better pls')
  await ui.unmount()
})

test('an empty prompt box is left alone', async ($, on) => {
  const filled: string[] = []
  on('prompt.read', () => ({ value: { text: '   ', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    return { isFilled: true, text: e.text, cursor: e.text.length }
  })
  const ui = await $.ui.mount({ plugin: 'prompt-master', surface: 'terminal', component: 'AbovePrompt', props, viewport })
  await ui.press({ key: 'prompt-master' })
  expect(filled).toEqual([])
  await ui.unmount()
})
