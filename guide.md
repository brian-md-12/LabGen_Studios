
# LabGen AI | Deployment & Researcher Guide

Follow these steps to deploy your application to Vercel and understand how to manage the Neural API Infrastructure.

## 1. Deploying to Vercel
1. Push all files (including `package.json`, `vite.config.ts`, and `vercel.json`) to a GitHub repository.
2. Log in to the [Vercel Dashboard](https://vercel.com).
3. Import your repository. Vercel will detect **Vite** automatically.
4. Add the following Environment Variables in the Vercel Settings:
   - `API_KEY`: Your master Admin Gemini Key.
   - `VITE_SUPABASE_URL`: From your Supabase project.
   - `VITE_SUPABASE_ANON_KEY`: From your Supabase project.

---

## 2. Obtaining Personal Research Keys (BYOK Tier)
In LabGen Studio v5.0, researchers can opt to use their own API keys to bypass managed infrastructure limits. Follow these steps to generate your keys:

### Step A: Access Google AI Studio
1. Navigate to [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/).
2. Sign in with your institutional or personal Google Account.

### Step B: Generate the API Key
1. Click the **"Get API key"** button in the sidebar.
2. Click **"Create API key"** and choose a project.
3. **Note on Billing:** For standard models (Gemini Flash), a free tier is available. For high-fidelity models like **Veo (Video)** and **Gemini 3 Pro Image**, you must attach a billing account to your Google Cloud project. See [ai.google.dev/pricing](https://ai.google.dev/pricing) for details.

### Step C: Key Capabilities for LabGen
LabGen Studio allows you to input separate keys for different capabilities. While one "Primary" key can often handle all tasks, you may want specialized keys for:
- **Primary Core (Text/Reasoning):** Required for storyboard synthesis and report generation.
- **Imaging Core:** Used for high-resolution (2K/4K) laboratory scene generation.
- **Motion Core (Veo):** Specifically required for cinematic video animation.

---

## 3. Configuring the Personal Tier in-app
1. Open your **Researcher Profile** (click your avatar in the sidebar).
2. Toggle the **API Access Tier** to **"Personal BYOK"**.
3. Paste your generated keys into the relevant fields.
4. Click **"Commit Configuration"**. The engine will validate the keys before saving them to your local encrypted session storage.

---

## 4. Troubleshooting Authentication
If "Institutional Single Sign-On" is failing:
1. Ensure your **Site URL** in Supabase is set to your Vercel deployment URL.
2. Disable **Vercel Deployment Protection** in your Vercel Project Settings to allow Supabase to redirect back to the studio correctly.
3. See [SUPABASE_AUTH_GUIDE.md](./SUPABASE_AUTH_GUIDE.md) for a detailed OAuth walkthrough.

## Copyright
© Kevin Brian | LabGen Studio v5.0
