export type PromptCount = number

declare module 'claude-code' {
  interface PluginState {
    'clear-reminder': { count: PromptCount }
  }
}
