---
title: "The Ultimate Geek Guide to Zellij: Shortcuts, Copy-Paste, and Mouse Operations for the Multi-threaded Terminal"
description: "A concise, ready-to-reference guide to Zellij's most commonly used core shortcuts, copy-pasting, background persistence, and mouse operations. Covers the four major modes (Pane / Tab / Scroll / Session), three ultimate techniques, and one-time optimization settings for config.kdl and aliases."
pubDate: 2026-06-05
updatedDate: 2026-06-05
tldr:
  - "A concise, ready-to-reference guide to Zellij's most commonly used core shortcuts, copy-pasting, background persistence, and mouse operations"
  - "Covers the four major modes (Pane / Tab / Scroll / Session), three ultimate techniques, and one-time optimization settings for config"
  - "kdl and aliases"
  - "One table for the core shortcuts — keyboard-first and mouse-friendly paths in parallel"
audience:
  - "Engineers and PMs tracking AI product and industry signals"
  - "Readers who want a fast brief before deciding whether to go deeper"
category: "Cloud & Platform"
tags: ["Productivity","Developer Tools","CLI"]
image: "/blog/22-zellij-terminal-guide/title_image.webp"
subtitle: "One table for the core shortcuts — keyboard-first and mouse-friendly paths in parallel"
kind: guide
showToc: true
---
The core logic of Zellij is: first press **`Ctrl + <letter>`** to enter a mode, then press a **single letter** to execute an action. This guide condenses the most commonly used shortcuts, copy-paste operations, background persistence, and mouse operations into one place. It is recommended to bookmark this or keep it open in a Pane for quick reference.

> **Huahua in one sentence**
>
> The terminal also needs to be cut neatly to be comfortable! Use Zellij to lock frequently used images in the background, and use both keyboard and mouse to maximize efficiency~🐾💻
>
> **Huahua's engineering note**
>
> In order to maximize the potential of Zellij, it is recommended to set up config.kdl and alias in advance, and skillfully use core mode switching shortcut keys such as Pane/Tab/Scroll to manage multi-tasking terminal tasks.

## Core Shortcuts Overview (At a Glance)

| Core Mode | Entry Shortcut | Common Actions in Mode (Single Keystroke) |
| --- | --- | --- |
| **Pane Mode** (Split panels) | `Ctrl + p` | `r` split right, `d` split down, `n` auto split, `x` close, `f` toggle fullscreen, `r` (press again) rename |
| **Tab Mode** (Browser-like tabs) | `Ctrl + t` | `n` new tab, `x` close tab, `r` rename, `h` / `l` switch tabs left/right |
| **Scroll Mode** (View logs, copy) | `Ctrl + s` | `j` / `k` scroll up/down, `PageUp` / `PageDown` page up/down, `c` enter keyboard-only copy mode |
| **Session Mode** (Background persistence) | `Ctrl + o` | `d` detach, `w` visual switch between different projects |
| **Universal Escape Key** | `Esc` or `Space` | Exit current mode, return to normal terminal input state |

## Three Ultimate Techniques

### Technique 1: Multi-threaded Switching and Scaling Secrets

When you have opened a "4+1" five-thread base, your hands don't need to leave the keyboard. This is the fastest way to switch:

- **Switch panels directly without entering a mode:** Hold **`Alt` + Arrow Keys** (or `h/j/k/l`), and the cursor will leap directly between panels.
- **Instant zoom (Fullscreen):** Move the cursor to the desired Pane, press **`Ctrl + p`** and then **`f`**. This panel will instantly expand to fill the entire screen, allowing you to focus on reading logs or modifying code; press `Ctrl + p` + `f` again to shrink it back to its original size.
- **Dynamically adjust panel size:** Press **`Ctrl + n`** (Resize mode), then press **`+`** or **`-`**, or the arrow keys, to fine-tune the width and height of the current panel.

### Technique 2: The Art of Copy and Paste

The most common pitfall when using Zellij is copying and pasting. Here are two routes to choose from:

- **Mouse Route (Bypassing the defense):** Hold **`Shift`**, highlight with the mouse → **`Ctrl + Shift + C`** to copy → **`Ctrl + Shift + V`** to paste.
- **Keyboard Route (Pure mouse-free operation):**
  1. **`Ctrl + s`** → press **`c`** → use arrow keys to move to the starting point.
  2. Press **`Space`** to start highlighting → move arrow keys to select text.
  3. Press **`Enter`** to successfully copy (synced to the Ubuntu system clipboard, so you can paste outside as well).

### Technique 3: Time Freeze (Background Persistence)

When you get off work, or need to leave temporarily for a meeting, don't close Zellij:

1. In Zellij, press **`Ctrl + o`**, then press **`d`** (Detach).
2. At this point, you will return to the original clean Ubuntu terminal, but your 5 threads are still running wildly in the background (programs are not interrupted).
3. Tomorrow at work, just enter in the terminal:

```bash
zellij attach
```

4. **Teleport back!** The five panels from yesterday, the half-run processes, and the organized filenames will pop back up exactly as they were.

## Ultimate Geek Optimization (Once and For All)

It is recommended that you immediately configure these two small optimizations in Ubuntu to make using Zellij as natural as breathing.

### 1. Write to Configuration File (Automatic Mouse Copy)

Enter the command in the terminal to create the configuration directory:

```bash
mkdir -p ~/.config/zellij
```

Then create or modify `~/.config/zellij/config.kdl`, and paste these two lines:

```kdl
// Copy selected text to system clipboard automatically
copy_on_select true
// Optional theme: default, clean, compact
theme "default"
```

### 2. Set Up a Short Alias

Open your `~/.bashrc` or `~/.zshrc`, and add these two lines at the very bottom:

```bash
alias zj="zellij"
alias rp="zellij action rename-pane"
```

Save the file and execute `source ~/.bashrc`.

- From now on, you only need to type `zj` to start Zellij.
- To rename a panel, simply type directly in the panel: `rp "Testing"`.

## The Ultimate Guide to Zellij Mouse Operations

As long as your Terminal has mouse support enabled, you can use the mouse to perform the following satisfying operations entirely within Zellij:

### 1. Window Switching and Scaling (No Shortcuts Needed)

- **Click to switch:** **Left-click** on any panel (Pane) or the tabs at the top, and the cursor will jump directly there.
- **Double-click to zoom (Fullscreen):** **Double left-click** on the "border" or the top "title bar" of any panel, and it will instantly expand to full screen; double-click again, and it will shrink back to the original five-grid layout.

### 2. Border Dragging (Dynamically Adjust Panel Size)

- **Drag windows with the mouse:** Move the mouse cursor to the **divider (border)** between panels, and the cursor will turn into a resize symbol. Now **click and drag the left mouse button** to directly enlarge or shrink the space of a certain thread.

### 3. Mouse Copy and Paste (Core Ultimate Move)

Depending on whether you have enabled `copy_on_select`, the operation will be slightly different:

- **Scenario A: If you have enabled the `copy_on_select true` setting**
  - **Copy:** Directly use the left mouse button to select the text you want; **the moment you release the mouse button, the text is already copied**.
  - **Paste:** In the place where you want to input, press the **middle mouse button (click the scroll wheel)**, or press `Ctrl + Shift + V` to paste directly.

- **Scenario B: General default situation (or if you want to bypass Zellij to copy internal text)**
  - **Force Copy:** Hold down the **`Shift` key**, use the mouse to select text, then right-click and select copy (or press `Ctrl + Shift + C`).
  - **Force Paste:** Hold down the **`Shift` key**, and press the **middle mouse button** (or press `Ctrl + Shift + V`).

### 4. Scroll Wheel Scrolling (View Old Logs)

- **Mouse Scroll Wheel:** Directly **scroll up with the scroll wheel** in any panel, and Zellij will automatically switch you to the `Scroll` mode, allowing you to view the missing upper half of the logs.
- **Return to the latest progress:** Scroll all the way to the bottom, or press **`Esc`**, and you will immediately return to the real-time Terminal input state.

## Shortcut + Mouse Reference Table

Combine the keyboard route and the mouse route, and your arsenal will be complete:

| What You Want to Do | Keyboard Geek Route | Mouse Intuitive Route |
| --- | --- | --- |
| **Switch panels** | `Alt` + Arrow Keys | **Click directly** on the panel |
| **Fullscreen panel** | `Ctrl + p` → `f` | **Double-click** on the panel border |
| **Adjust panel size** | `Ctrl + n` → Arrow Keys | **Click and drag the border** |
| **Copy text** | `Ctrl + s` → `c` → Select → `Enter` | Hold `Shift` + **Mouse Selection** (or enable setting for auto-copy) |
| **View previous logs** | `Ctrl + s` → `PageUp` | **Scroll up directly** with the mouse wheel |

Keyboard as the main attacker, mouse as the assist—this "4+1" five-thread base is now completely under your control.
