---
title: "Zellij 怎麼用：快捷鍵、複製貼上與 Session 操作"
description: "依 Zellij 現行預設鍵位整理 Pane、Tab、Resize、Scroll、Session、複製貼上與滑鼠操作，並說明自訂設定造成的差異。"
pubDate: 2026-06-05
updatedDate: 2026-08-29
tldr:
  - "先用 Ctrl+p／t／n／s／o 進入 Pane、Tab、Resize、Scroll 與 Session 模式，再按單鍵執行動作"
  - "預設滑鼠選取會自動複製；若終端機不支援 OSC 52，可在 config.kdl 設定 copy_command"
  - "快捷鍵可能被 preset 或個人 config 覆寫，疑難排解時先查看目前設定"
audience:
  - "第一次使用 Zellij 管理多個終端工作的開發者"
  - "需要快速查找預設鍵位、複製與 Session 操作的人"
category: "Cloud & Platform"
tags: ["Productivity","Developer Tools","CLI"]
image: "/blog/22-zellij-terminal-guide/title_image.webp"
subtitle: "以目前預設鍵位為準的鍵盤、滑鼠與 Session 速查表"
kind: guide
showToc: true
---
Zellij 的預設操作多半是「先進入模式，再按單鍵執行」。這篇依 2026 年 8 月 29 日的[官方預設鍵位](https://github.com/zellij-org/zellij/blob/main/zellij-utils/assets/config/default.kdl)整理；若你選了不同 keybinding preset 或修改過 `config.kdl`，實際按鍵可能不同。

> **花花的一句話**
>
> 把 `Ctrl+p`、`Ctrl+t`、`Ctrl+n`、`Ctrl+s`、`Ctrl+o`記成 Pane、Tab、Resize、Scroll、Session，日常操作就有骨架了。

> **花花的工程提醒**
>
> 不要把網路上的快捷鍵表當永久規格。Zellij 支援完整覆寫鍵位，升級或套用 preset 後應以目前設定和官方預設檔為準。

## 預設快捷鍵速查

| 模式 | 進入方式 | 常用動作 |
| --- | --- | --- |
| **Pane** | `Ctrl+p` | `n` 新 Pane、`d` 向下切、`r` 向右切、`x` 關閉、`f` 全螢幕、`c` 重新命名 |
| **Tab** | `Ctrl+t` | `n` 新 Tab、`x` 關閉、`r` 重新命名、`h/l` 前後切換 |
| **Resize** | `Ctrl+n` | 方向鍵或 `h/j/k/l` 調整指定方向、`+/-` 整體放大縮小 |
| **Scroll** | `Ctrl+s` | `j/k` 捲動、`PageUp/PageDown` 翻頁、`e` 用編輯器開 scrollback、`c` 複製上一個命令輸出 |
| **Session** | `Ctrl+o` | `d` detach、`w` 開啟 session manager |

在多數模式中按 `Esc` 或 `Enter` 會回到 Normal 模式。Pane 重新命名是 `Ctrl+p` → `c`；`r` 的作用是向右建立 Pane，兩者不要混用。

## 不進模式也能使用的操作

預設設定提供幾組直接操作：

- `Alt` + 方向鍵，或 `Alt+h/j/k/l`：移動焦點。
- `Alt+n`：建立新 Pane。
- `Alt+=`／`Alt++` 與 `Alt+-`：放大或縮小目前 Pane。
- `Ctrl+p` → `f`：切換目前 Pane 的全螢幕狀態。

這些組合若和 shell、桌面環境或終端機衝突，可以改用模式鍵，或參考[官方 Keybindings 文件](https://zellij.dev/documentation/keybindings.html)調整。

## 複製與貼上：先分清 Zellij 和終端機

Zellij 的[設定文件](https://zellij.dev/documentation/options.html)指出，`copy_on_select` 預設為 `true`。用滑鼠選取文字並放開時，Zellij 會嘗試複製；若沒有設定 `copy_command`，預設透過 OSC 52 寫入系統剪貼簿。

幾個常見情況：

- **滑鼠選取後已自動複製**：直接使用終端機的貼上方式，例如 `Ctrl+Shift+V`。
- **想繞過 Zellij 的滑鼠處理**：許多終端機可按住 `Shift` 再選取，但這是 host terminal 行為，並非所有環境相同。
- **OSC 52 無法寫入剪貼簿**：在 `config.kdl` 指定 `copy_command`，例如 Wayland 的 `wl-copy` 或 macOS 的 `pbcopy`。
- **Scroll 模式按 `c`**：目前預設是 `CopyLastCommandOutput`，不是任意範圍的鍵盤選取模式。

Linux Wayland 的設定範例：

```kdl
copy_command "wl-copy"
copy_on_select true
```

使用 X11 時可改成 `xclip -selection clipboard`。設定前先確認對應工具已安裝。

## Detach、Attach 與 Session Manager

要暫時離開但保留工作中的 process：

1. 按 `Ctrl+o` 進入 Session 模式。
2. 按 `d` detach。
3. 回來後執行 `zellij attach`；有多個 session 時可先執行 `zellij list-sessions`。

`Ctrl+o` → `w` 會開啟 session manager，適合用互動畫面切換 session。Detach 只讓目前 client 離開，不等於 process 能跨主機重開或永遠保存；是否能在退出或重開機後復原，還取決於 session serialization 與程式本身的狀態。

## 滑鼠操作與版本差異

目前的 `advanced_mouse_actions` 預設為 `true`，可拖曳 tiled Pane 的邊界調整大小，也可用 `Ctrl` + 滾輪縮放焦點 Pane。直接滾動會配合 `scroll_mode_sync` 進出 Scroll 模式。

滑鼠功能同時受 Zellij、終端機模擬器與遠端連線影響。若點擊、選取或滾輪行為不一致，依序檢查 `mouse_mode`、`advanced_mouse_actions`、`copy_on_select`，以及 host terminal 是否攔截組合鍵。

## 延伸閱讀與官方來源

- 官方：[Configuring Keybindings](https://zellij.dev/documentation/keybindings.html)、[Options](https://zellij.dev/documentation/options.html)、[目前預設 `default.kdl`](https://github.com/zellij-org/zellij/blob/main/zellij-utils/assets/config/default.kdl)。
- 若你用終端機驅動 AI 開發工作流，可接著讀 [AI 軟體開發環境選型](/blog/89-ai-powered-software-development-environments/)與 [Agent 時代的 Skills、Subagents、Commands 與 Hooks](/blog/29-agent-era-skills-subagents-commands-hooks/)。
