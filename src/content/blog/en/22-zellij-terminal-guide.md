---
title: "How to Use Zellij: Shortcuts, Clipboard, and Sessions"
description: "A current-default reference for Zellij Pane, Tab, Resize, Scroll, Session, clipboard, and mouse operations, including the impact of custom keybindings."
pubDate: 2026-06-05
updatedDate: 2026-08-29
tldr:
  - "Use Ctrl+p/t/n/s/o to enter Pane, Tab, Resize, Scroll, and Session modes, then press a single action key"
  - "Mouse selection copies by default; configure copy_command when the terminal does not support OSC 52"
  - "Presets and config.kdl can override every shortcut, so troubleshoot against the active configuration"
audience:
  - "Developers using Zellij to manage multiple terminal workflows for the first time"
  - "People who need a quick reference for default shortcuts, clipboard behavior, and sessions"
category: "Cloud & Platform"
tags: ["Productivity","Developer Tools","CLI"]
image: "/blog/22-zellij-terminal-guide/title_image.webp"
subtitle: "A keyboard, mouse, and session reference based on current defaults"
kind: guide
showToc: true
---
Most default Zellij operations follow a two-step pattern: enter a mode, then press an action key. This guide follows the [official default keybindings](https://github.com/zellij-org/zellij/blob/main/zellij-utils/assets/config/default.kdl) checked on August 29, 2026. A different keybinding preset or a customized `config.kdl` can change the actual keys.

> **Huahua in one sentence**
>
> Remember `Ctrl+p`, `Ctrl+t`, `Ctrl+n`, `Ctrl+s`, and `Ctrl+o` as Pane, Tab, Resize, Scroll, and Session, and the rest of the workflow has a stable skeleton.

> **Huahua's engineering note**
>
> A shortcut table is not a permanent specification. Zellij can override all bindings, so check the active configuration and current default file after changing presets or upgrading.

## Default shortcut reference

| Mode | Enter with | Common actions |
| --- | --- | --- |
| **Pane** | `Ctrl+p` | `n` new pane, `d` split down, `r` split right, `x` close, `f` fullscreen, `c` rename |
| **Tab** | `Ctrl+t` | `n` new tab, `x` close, `r` rename, `h/l` previous or next |
| **Resize** | `Ctrl+n` | arrows or `h/j/k/l` resize by direction, `+/-` grow or shrink |
| **Scroll** | `Ctrl+s` | `j/k` scroll, `PageUp/PageDown` page, `e` edit scrollback, `c` copy the last command output |
| **Session** | `Ctrl+o` | `d` detach, `w` open session manager |

In most modes, `Esc` or `Enter` returns to Normal mode. Pane rename is `Ctrl+p` → `c`; `r` creates a pane to the right.

## Direct actions without entering a mode

The default configuration also provides several direct actions:

- `Alt` + arrow, or `Alt+h/j/k/l`: move focus.
- `Alt+n`: create a pane.
- `Alt+=`/`Alt++` and `Alt+-`: grow or shrink the focused pane.
- `Ctrl+p` → `f`: toggle pane fullscreen.

If these combinations conflict with a shell, desktop environment, or terminal, use the mode-based bindings or customize them with the [official keybinding guide](https://zellij.dev/documentation/keybindings.html).

## Clipboard behavior: separate Zellij from the host terminal

The Zellij [options reference](https://zellij.dev/documentation/options.html) documents `copy_on_select` as `true` by default. Releasing a mouse selection asks Zellij to copy it; without a configured `copy_command`, Zellij uses OSC 52 to write to the system clipboard.

Common cases:

- **Mouse selection already copied:** paste with the host terminal shortcut, commonly `Ctrl+Shift+V`.
- **Bypassing Zellij mouse handling:** many terminals let you hold `Shift` while selecting, but this is host-terminal behavior and is not universal.
- **OSC 52 does not reach the clipboard:** set `copy_command`, such as `wl-copy` on Wayland or `pbcopy` on macOS.
- **Pressing `c` in Scroll mode:** the current default is `CopyLastCommandOutput`, not an arbitrary keyboard selection mode.

Example for Linux on Wayland:

```kdl
copy_command "wl-copy"
copy_on_select true
```

For X11, use a command such as `xclip -selection clipboard`. Install the corresponding utility first.

## Detach, attach, and Session Manager

To leave temporarily while keeping processes running:

1. Press `Ctrl+o` for Session mode.
2. Press `d` to detach.
3. Run `zellij attach` when returning; use `zellij list-sessions` first if several sessions exist.

`Ctrl+o` → `w` opens Session Manager for interactive switching. Detach only disconnects the current client. It does not guarantee that a process can survive a host reboot; restoration also depends on session serialization and the program's own state.

## Mouse operations and version differences

`advanced_mouse_actions` currently defaults to `true`. It allows dragging tiled pane borders and using `Ctrl` + scroll wheel to resize the focused pane. Ordinary scrolling cooperates with `scroll_mode_sync` to enter and leave Scroll mode.

Mouse behavior also depends on Zellij, the terminal emulator, and any remote connection. When clicking, selection, or scrolling behaves differently, check `mouse_mode`, `advanced_mouse_actions`, `copy_on_select`, and whether the host terminal intercepts the keys.

## Next reading and official sources

- Official: [Configuring Keybindings](https://zellij.dev/documentation/keybindings.html), [Options](https://zellij.dev/documentation/options.html), and the current [`default.kdl`](https://github.com/zellij-org/zellij/blob/main/zellij-utils/assets/config/default.kdl).
- For terminal-driven AI development, continue with [AI software development environment selection](/en/blog/89-ai-powered-software-development-environments/) and [Skills, Subagents, Commands, and Hooks in the Agent Era](/en/blog/29-agent-era-skills-subagents-commands-hooks/).
