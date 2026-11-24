export type MasterStatus = 'idle' | 'working'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': {
      status: MasterStatus
      // Rewritten prompt kept for surfaces whose prompt box a mod cannot fill.
      pending: string | null
      // The draft before the last rewrite, for Undo.
      original: string | null
    }
  }
}
