
# LabGen AI | Supabase Auth & Google OAuth Setup

Follow these steps to enable secure authentication and Google Sign-In for your LabGen AI instance.

## 1. Supabase Project Setup
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project or select an existing one.
3. Navigate to **Project Settings** > **API**.
4. Copy the **Project URL** and the **anon (public) Key**.
5. Add these to your `.env` or Vercel Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 2. Enable Google Provider in Supabase
1. In your Supabase dashboard, go to **Authentication** > **Providers**.
2. Find **Google** and toggle it **ON**.
3. **CRITICAL FOR DRIVE**: Under **Scopes**, add `https://www.googleapis.com/auth/drive.file`. This allows the app to create files and folders in the user's Google Drive.
4. You will see a **Redirect URI** (usually looks like `https://[your-project-id].supabase.co/auth/v1/callback`). **Copy this URI**; you will need it for the Google Cloud Console.

## 3. Configure Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "LabGen AI Auth").
3. Navigate to **APIs & Services** > **Library**.
   - Search for and enable **Google Drive API**.
4. Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External** (if prompted) and click **Create**.
   - Fill in the App Name ("LabGen AI") and your support email.
   - Under **Scopes**, click **Add or Remove Scopes** and select `.../auth/drive.file`.
   - Add `supabase.co` to the **Authorized domains**.
5. Navigate to **Credentials**.
6. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - **Application type**: Web application.
   - **Authorized redirect URIs**: 
     - Paste the **Redirect URI** you copied from Supabase in Step 2.
7. Click **Create** and copy your **Client ID** and **Client Secret**.

## 4. Finalize Supabase Config
1. Go back to the Supabase **Google Provider** settings.
2. Paste the **Client ID** and **Client Secret**.
3. Ensure the **Scopes** field includes `https://www.googleapis.com/auth/drive.file`.
4. Click **Save**.

## 5. Troubleshooting "Vercel Sign-on" Redirects
If you are being redirected to a Vercel login page after authenticating with Google, check these two items:

### A. Disable Vercel Deployment Protection
Vercel's "Deployment Protection" intercepts the redirect from Supabase and forces a Vercel login.
1. Go to your **Vercel Project Dashboard**.
2. Click **Settings** > **Deployment Protection**.
3. Set **Vercel Authentication** to **Disabled** for all environments.
4. Click **Save**.

### B. Configure Site URL correctly
1. In **Supabase Dashboard**, go to **Authentication** > **URL Configuration**.
2. **Site URL**: Must be your exact Vercel URL (e.g., `https://your-app.vercel.app`).
3. **Redirect URLs**: Add `http://localhost:5173/**` and `https://your-app.vercel.app/**`.

Your "Institutional Single Sign-On" button will now return you directly to LabGen Studio and grant full Drive archival permissions!
