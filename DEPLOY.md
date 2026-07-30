# 🚀 Deploy YH Backend to Render.com (Free)

> **Two ways to deploy:**
> 1. **Manual** (recommended — works every time)
> 2. **Blueprint** (one-click, but can be finicky)

---

## ✅ METHOD 1: Manual Deploy (Recommended)

This method is the most reliable. Follow these steps exactly.

### Step 1: Sign Up on Render

1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Choose **Continue with GitHub**
4. Authorize Render to access your repos

---

### Step 2: Create New Web Service

1. On your Render Dashboard, click **New +** → **Web Service**
2. Find your repo: `yuenhui2007-hash/jishua`
3. Click **Connect**

---

### Step 3: Configure Settings

Fill in these exact values:

| Setting | Value |
|---------|-------|
| **Name** | `yh-backend` (or any name you want) |
| **Region** | Singapore (closest to Malaysia) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ VERY IMPORTANT |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

Click **Create Web Service**

---

### Step 4: Add Environment Variables

After creation, go to the **Environment** tab on the left sidebar.

Add these **required** variables:

```
NODE_ENV = production
FRONTEND_URL = https://yuenhui2007-hash.github.io
JWT_SECRET = yh-secret-key-change-this-to-something-random
```

Add these **optional** variables (only if you want AI features):

```
OPENAI_API_KEY = sk-your-openai-key-here
```

> 💡 Get your OpenAI key at: https://platform.openai.com/api-keys

---

### Step 5: Deploy

Render will build and deploy automatically. This takes **2-3 minutes**.

Watch the logs. You'll see:
- `npm install` running
- `✅ YH Backend running on port 10000`
- A green **Live** badge appears

**Your URL will look like:**
```
https://yh-backend.onrender.com
```

> 📝 The actual URL depends on the name you chose in Step 3.

---

### Step 6: Connect Frontend to Backend

In both `payment-portal.html` and `admin.html`, find this line:

```js
window.API_BASE_URL = 'http://localhost:5000';
```

Change it to your Render URL:

```js
window.API_BASE_URL = 'https://yh-backend.onrender.com';
```

Then push to GitHub:

```bash
git add -A
git commit -m "Switch to production API URL"
git push
```

Wait 1-2 minutes for GitHub Pages to update.

---

### Step 7: Test

1. Open: `https://yuenhui2007-hash.github.io/jishua/payment-portal.html`
2. Fill the form and submit
3. Check admin: `https://yuenhui2007-hash.github.io/jishua/admin.html`
4. Your order should appear!

---

## 🔵 METHOD 2: Blueprint Deploy (One-Click)

If you want to use the `render.yaml` file in your repo:

1. Go to **https://dashboard.render.com/blueprints**
2. Click **New Blueprint Instance**
3. Select your `jishua` repo
4. Click **Apply**
5. Render will read `render.yaml` and create the service automatically

> ⚠️ This sometimes fails if Render can't detect the blueprint. If it fails, use **Method 1** above.

---

## 🔗 Your Final Links

| Service | URL |
|---------|-----|
| 🌐 **Your Backend** | `https://yh-backend.onrender.com` (your actual URL) |
| 🔍 Health Check | `https://yh-backend.onrender.com/api/health` |
| 💳 Payment Portal | https://yuenhui2007-hash.github.io/jishua/payment-portal.html |
| 🏢 Admin Dashboard | https://yuenhui2007-hash.github.io/jishua/admin.html |

---

## 🆘 Troubleshooting

### "Build Failed" or "Deploy Failed"

**Cause:** `better-sqlite3` (native module) failed to compile.

**Fix:** This usually fixes itself on re-deploy. On your Render dashboard:
1. Click your service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for it to retry

If it still fails, add this environment variable:
```
NODE_OPTIONS = --max-old-space-size=4096
```

---

### "Backend offline" on frontend

**Cause:** Frontend can't reach backend.

**Fix:**
1. Make sure `window.API_BASE_URL` in `payment-portal.html` and `admin.html` matches your Render URL **exactly**
2. Make sure `FRONTEND_URL` env var on Render is set to `https://yuenhui2007-hash.github.io`
3. Check that your Render service shows **Live** (green badge)

---

### "CORS error" in browser console

**Cause:** Backend is blocking requests from GitHub Pages.

**Fix:**
1. Go to Render dashboard → your service → Environment
2. Make sure `FRONTEND_URL = https://yuenhui2007-hash.github.io`
3. Click **Manual Deploy** → **Deploy latest commit**

---

### "No orders showing in admin"

**Cause 1:** Backend is sleeping (Render free tier sleeps after 15 min).

**Fix:** Click around the payment portal — the first request will wake the backend (takes ~30 seconds).

**Cause 2:** Database not initialized.

**Fix:** Check Render logs for `✅ Database tables initialized`. If you don't see this, the database failed to create. Try redeploying.

---

### "AI concept generation failed"

**Cause:** No OpenAI API key set.

**Fix:** Add `OPENAI_API_KEY` to Render environment variables, then redeploy. Or the system will use fallback templates (no AI).

---

## 💰 Cost

Render's **Free Tier** includes:
- 512 MB RAM
- 0.1 CPU
- Sleeps after 15 min idle (wakes on next request, ~30 sec delay)
- 100 GB bandwidth/month

Perfect for your project! Upgrade to **Starter ($7/month)** if you want it to never sleep.
