# Prompt Master

Rewrites your rough prompt into a clearer, more effective one before you send it.

- Type a rough prompt, then press **✨ Prompt Master** (the button just above the prompt box). The draft in the box is replaced with the improved version so you can review or edit it, then press Enter to send.
- **Undo** restores your original draft.
- `/prompt-master <text>` does the same from a slash command.

It keeps your intent, facts and constraints, adds structure (goal, context, requirements, output format), and leaves `[placeholders]` for anything important you left out instead of guessing.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-master --marketplace AMTrainingCo/prompt-master
```

Answer `y` to add the marketplace, then pick the user scope so it loads in every session.

From a shell: `claude plugin install prompt-master --marketplace AMTrainingCo/prompt-master`

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `AMTrainingCo/prompt-master`, then Add plugin.
