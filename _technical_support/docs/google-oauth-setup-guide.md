# Google OAuth Configuration Guide for Stocky

To complete Google OAuth sign-in for Stocky, follow these steps to connect Google Cloud Console with your Supabase project (`qwgpykxjzgqbdzakhchm`).

---

## 1. Supabase Redirect URL
Your Supabase project's authorized OAuth redirect URL is:
```
https://qwgpykxjzgqbdzakhchm.supabase.co/auth/v1/callback
```

---

## 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g. `Stocky`).
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - Choose **External** (or Internal for Google Workspace domain).
   - App Name: `Stocky`
   - User support email: `stocky.admin@gmail.com`
   - Developer contact email: `stocky.admin@gmail.com`
   - Save and continue.
4. Navigate to **APIs & Services** → **Credentials**:
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Stocky Web Auth`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - Your production Vercel URL (e.g. `https://stocky.vercel.app`)
   - **Authorized redirect URIs**:
     - `https://qwgpykxjzgqbdzakhchm.supabase.co/auth/v1/callback`
   - Click **Create**.
5. Copy your **Client ID** and **Client Secret**.

---

## 3. Enable Google Provider in Supabase
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/qwgpykxjzgqbdzakhchm).
2. Go to **Authentication** → **Providers** in the sidebar.
3. Select **Google** and toggle it **ON**.
4. Paste the **Client ID** and **Client Secret** copied from Google Cloud Console.
5. Click **Save**.

---

## 4. Test in Stocky
1. Run `pnpm --filter web dev`.
2. Click **Sign in with Google** in the top navigation bar.
3. Google will authenticate the session and redirect back to Stocky at `/auth/callback`, establishing your Supabase session.
