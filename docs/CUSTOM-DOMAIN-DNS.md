# Custom domain DNS setup: bloss0m.xyz → GitHub Pages

When GitHub shows **InvalidDNSError** or "Domain's DNS record could not be retrieved", the DNS for your domain is not yet correct or not visible to GitHub. Follow the steps below.

## 1. Add DNS records at your domain provider

Where you bought bloss0m.xyz (e.g. Cloudflare, Namecheap, Google Domains, etc.):

### For www.bloss0m.xyz (recommended)

| Type  | Name | Value / Target        | TTL  |
|-------|------|------------------------|------|
| CNAME | www  | poirotw66.github.io   | Auto |

- **Name**: `www` (or `www.bloss0m.xyz` if the provider requires the full name).
- **Target**: exactly `poirotw66.github.io` (no `https://`, no trailing slash, no repo name).

### If GitHub still checks the apex (bloss0m.xyz)

Add **one** of these:

**Option A – A records (works everywhere)**

| Type | Name | Value           |
|------|------|-----------------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

**Option B – ALIAS/ANAME (if your provider supports it)**  
- Name: `@`  
- Target: `poirotw66.github.io`

## 2. If you use Cloudflare

- Set the **www** CNAME to **DNS only** (grey cloud), **not Proxied** (orange cloud).  
- Proxied CNAME to GitHub Pages often causes **InvalidDNSError** because GitHub cannot see the real CNAME.

## 3. Check that DNS is correct

From your machine (or use an online “DNS lookup” tool):

```bash
# Should show CNAME to poirotw66.github.io
dig www.bloss0m.xyz +short CNAME

# If you use apex, A records should show GitHub IPs
dig bloss0m.xyz +short A
```

Wait 5–30 minutes (or up to 24 hours in rare cases), then in the repo:

- **Settings → Pages → Custom domain**: enter `www.bloss0m.xyz` and **Save**.
- If it still shows an error, remove the custom domain, wait a few minutes, then add `www.bloss0m.xyz` again.

## 4. This repo (GitHub Actions deploy)

- The site is built with Astro and deployed via GitHub Actions; `public/CNAME` is included in the build so the deployed site has the correct CNAME.
- In GitHub you only need to set the **Custom domain** in **Settings → Pages**; the CNAME file in the repo is for the built output.

---

## 5. Enforce HTTPS 無法勾選（憑證發不出來）

GitHub 用 **Let's Encrypt** 發憑證。若一直無法啟用 HTTPS，請依序檢查：

### 5.1 檢查 CAA 記錄（GoDaddy 等可能預設只允許自家 CA）

在終端機執行：

```bash
dig bloss0m.xyz CAA +short
```

- **沒有輸出**：代表沒有 CAA，理論上 Let's Encrypt 可發證；可跳過 5.2，直接做 5.3。
- **有輸出**：若沒有包含 `letsencrypt.org`，就要在 DNS 新增一筆允許 Let's Encrypt 的 CAA。

### 5.2 在 GoDaddy 新增 CAA（允許 Let's Encrypt）

1. 登入 GoDaddy → 網域 **bloss0m.xyz** → **DNS**（管理 DNS）。
2. **新增** → 類型選 **CAA**。
3. 設定：
   - **名稱**：`@`（表示根網域 bloss0m.xyz，會套用到 www 等子網域）。
   - **標記 (Tag)**：`issue`
   - **值 (Value)**：`letsencrypt.org`
   - **旗標 (Flags)**：`0`
4. 儲存。等 5–10 分鐘後再回 GitHub 試「強制執行 HTTPS」。

（若 GoDaddy 介面用「一欄填整筆」：`0 issue "letsencrypt.org"`。）

### 5.3 重新觸發憑證申請

1. **Settings → Pages → Custom domain** → 按 **Remove** 移除網域。
2. 等 **約 10 分鐘**。
3. 再輸入 `www.bloss0m.xyz`，按 **Save**。
4. 等 **最多約 1 小時**（有時更久），再試勾選 **Enforce HTTPS**。

### 5.4 若仍不行

- 確認 `http://www.bloss0m.xyz` 可正常開啟（代表 DNS 與 Pages 都正確）。
- 過 24 小時再試一次；憑證排程有時會延遲。
- 參考：[GitHub – Troubleshooting custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages#https-errors)。
