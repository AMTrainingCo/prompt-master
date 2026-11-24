import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { MasterStatus } from '../types'

const status = atom({ plugin: 'prompt-master', key: 'status' } as const, 'idle' as MasterStatus)
const pending = atom({ plugin: 'prompt-master', key: 'pending' } as const, null as string | null)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, null as string | null)

const SYSTEM = `You are Prompt Master, an expert prompt engineer. The user gives you a rough draft of a prompt they are about to send to an AI assistant (Claude). Rewrite it into a better prompt.

Rules:
- Keep the user's intent, facts, names, numbers, file paths and constraints exactly. Never invent requirements, data or context they did not give.
- State the goal clearly up front, then the relevant context, then specific requirements and constraints, then the desired output format, when the draft implies them.
- Fix spelling and grammar, remove filler and ambiguity, and split compound asks into clear numbered steps when that helps.
- Where something important is missing and cannot be inferred, add a short bracketed placeholder like [specify audience] rather than guessing.
- Match the scale of the request: a one-line question stays short; do not pad simple asks.
- Write in the first person as the user, addressed to the assistant.
- Output ONLY the rewritten prompt. No preamble, no explanation, no quotes, no markdown code fences.`

async function rewrite($: EngineInterface, given?: string): Promise<string> {
  if ((await read($, status)) === 'working') return 'Prompt Master is already working.'
  const draft = (given ?? (await $.prompt.read()).text).trim()
  if (!draft) {
    $.ui.toast('Type a rough prompt first, then press Prompt Master.')
    return 'Nothing to rewrite: the prompt box is empty.'
  }
  await update($, status, () => 'working' as MasterStatus)
  $.ui.status('Prompt Master: rewriting...')
  try {
    const r = await $.model.complete({
      model: 'sonnet',
      system: SYSTEM,
      prompt: `Rough draft to rewrite:\n\n${draft}`,
      maxTokens: 4000,
      timeoutMs: 90000,
    })
    if (!r.isAnswered) {
      $.ui.toast(`Prompt Master failed (${r.reason}). Your draft is unchanged.`)
      return `Rewrite failed: ${r.reason}`
    }
    const better = r.text.trim().replace(/^```[a-z]*\n?|\n?```$/g, '').trim()
    await update($, original, () => draft)
    const filled = await $.prompt.fill({ text: better, mode: 'replace' })
    if (filled.isFilled) {
      await update($, pending, () => null)
      $.ui.toast('Prompt rewritten. Review it, then press Enter to send.')
    } else {
      // No fillable box here (e.g. the app draws its own composer): show it in the band.
      await update($, pending, () => better)
    }
    return better
  } finally {
    await update($, status, () => 'idle' as MasterStatus)
    $.ui.status(undefined)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Rewrite a rough prompt into a better one (uses the prompt box, or the text after the command)',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async ($, e) => {
    const text = await rewrite($, e.args.trim() || undefined)
    return { text }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const isBusy = (await read($, status)) === 'working'
    const better = await read($, pending)
    const prior = await read($, original)

    if (better) {
      return (
        <Box flexDirection="column">
          <Text bold>Prompt Master rewrite:</Text>
          <Text>{better}</Text>
          <Box>
            <Button
              key="send"
              label="Send it"
              onPress={async () => {
                await update($, pending, () => null)
                await $.prompt.submit({ text: better, asUser: true })
              }}
            />
            <Text> </Text>
            <Button key="dismiss" label="Dismiss" onPress={() => update($, pending, () => null)} />
          </Box>
        </Box>
      )
    }

    return (
      <Box>
        <Button
          key="prompt-master"
          label={isBusy ? '✨ Rewriting…' : '✨ Prompt Master'}
          onPress={() => {
            if (!isBusy) void rewrite($)
          }}
        />
        {prior && !isBusy ? (
          <>
            <Text> </Text>
            <Button
              key="undo"
              label="Undo"
              onPress={async () => {
                await $.prompt.fill({ text: prior, mode: 'replace' })
                await update($, original, () => null)
              }}
            />
          </>
        ) : null}
      </Box>
    )
  })

  // Clear the Undo once the prompt is sent.
  on('prompt.submit', ($, e, next) => {
    update($, original, () => null).catch(() => {})
    return next(e)
  })
}
