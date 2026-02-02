# LabGen Studio | LIVE Production Guide

The system is now configured for **LIVE** monetary transactions. Follow these final checks.

---

## 1. Plan Verification (LIVE)
1. Go to your **PayPal Developer Dashboard**.
2. Toggle the switch at the top-right to **LIVE**.
3. Go to **Subscriptions > Plans**.
4. **MUST**: Ensure your Plan IDs start with `P-` and are marked as **ACTIVE**.
5. Copy these IDs into your `PAYPAL_PLAN_BASIC` and `PAYPAL_PLAN_PRO` variables.

---

## 2. Environment Checklist
| Variable | Value Context |
| :--- | :--- |
| `PAYPAL_CLIENT_ID` | Must be from the **LIVE** tab of your App. |
| `PAYPAL_CLIENT_SECRET` | Must be from the **LIVE** tab. |
| `API_KEY` | Ensure this is a Gemini key with a **paid billing account** for Veo/4K. |

---

## 3. Deployment Security
- Ensure your Vercel deployment is using **HTTPS** (automatic).
- Double-check that `PAYPAL_CLIENT_SECRET` is NOT prefixed with `VITE_` to keep it out of the browser bundle.

---

## 4. Diagnostic Layer
The **Diagnostic Tool** in the Billing Hub will now alert you if it detects a Sandbox-pattern Client ID while the system expects a Live production setup. Use this if the PayPal button fails to load.

© LabGen Studio v5.0 | High-Fidelity Scientific Production