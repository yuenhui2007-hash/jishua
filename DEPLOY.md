# 🚀 Deploy YH Backend to Render.com (Free)

Follow these exact steps to get your backend live with a public URL.

---

## Step 1: Sign Up on Render

1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Choose **Continue with GitHub**
4. Authorize Render to access your repos
5. Verify your email

---

## Step 2: Create a New Web Service

1. On your Render Dashboard, click **New +** → **Web Service**
2. Find and select your repo: `yuenhui2007-hash/jishua`
3. Click **Connect**

---

## Step 3: Configure the Service

Fill in these exact values:

| Setting | Value |
|---------|-------|
| **Name** | `yh-backend` (or any name you like) |
| **Region** | Singapore (closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ VERY IMPORTANT |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

Click **Create Web Service**

---

## Step 4: Add Environment Variables

After creation, go to **Environment** tab and add these:

**Required:**
```
NODE_ENV = production
FRONTEND_URL = https://yuenhui2007-hash.github.io
JWT_SECRET = any-long-random-string-here-123456789
```

**Optional (for AI features to work):**
```
OPENAI_API_KEY = sk-your-openai-key-here
ANTHROPIC_API_KEY = sk-your-anthropic-key-here
```

**Optional (for payments to work):**
```
STRIPE_SECRET_KEY = sk-your-stripe-key-here
```

> 💡 You can get OpenAI API keys at https://platform.openai.com/api-keys

---

## Step 5: Wait for Deploy

Render will build and deploy automatically. This takes ~2-3 minutes.

You'll see a green **Live** badge when ready.

**Your backend URL will look like:**
```
https://yh-backend.onrender.com
```
(Replace `yh-backend` with whatever name you chose)

---

## Step 6: Update Frontend to Point to Live Backend

### In `payment-portal.html` and `admin.html`:

Find this block near the top of each file:

```html
<script>
    window.API_BASE_URL = 'http://localhost:5000';
</script>
```

Change it to your Render URL:

```html
<script>
    window.API_BASE_URL = 'https://yh-backend.onrender.com';
</script>
```

---

## Step 7: Push Frontend Update

```bash
cd jishua
git add -A
git commit -m "Update API URL to production backend"
git push
```

Wait 1-2 minutes for GitHub Pages to update.

---

## Step 8: Test Everything

1. Open your live site: https://yuenhui2007-hash.github.io/jishua/payment-portal.html
2. Fill in the form and submit
3. Open admin: https://yuenhui2007-hash.github.io/jishua/admin.html
4. Your order should appear!

---

## 🔗 Your Links After Deploy

| Service | URL |
|---------|-----|
| Frontend (GitHub Pages) | https://yuenhui2007-hash.github.io/jishua/ |
| Backend (Render) | https://yh-backend.onrender.com |
| Health Check | https://yh-backend.onrender.com/api/health |
| Payment Portal | https://yuenhui2007-hash.github.io/jishua/payment-portal.html |
| Admin Dashboard | https://yuenhui2007-hash.github.io/jishua/admin.html |

---

## 🆘 Troubleshooting

**"Backend offline" on frontend?**
- Check that `FRONTEND_URL` env var is set to `https://yuenhui2007-hash.github.io`
- Make sure `window.API_BASE_URL` matches your Render URL exactly

**Orders not appearing in admin?**
- Check Render logs: Dashboard → your service → Logs
- Make sure `OPENAI_API_KEY` is set if using AI concept generation

**CORS errors in browser console?**
- The `FRONTEND_URL` env var tells the backend which sites are allowed
- Make sure it matches your GitHub Pages URL exactly

---

## 💰 Cost

Render's **Free Tier** includes:
- 512 MB RAM
- 0.1 CPU
- Spins down after 15 min idle (first request wakes it up ~30 sec delay)
- 100 GB bandwidth/month

This is perfectly fine for your project!

If you want it to never sleep, upgrade to **Starter** ($7/month).
