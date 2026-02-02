
# LabGen Studio 3.0

LabGen Studio is a cutting-edge web application designed to transform text-based laboratory protocols into engaging, multimodal instructional videos. Powered by Google's Gemini Models, it automates the creation of storyboards, visual assets, audio narration, and video clips.

## Features

*   **Intelligent Storyboarding**: Converts raw text protocols into structured, scene-by-scene visual instructions using `gemini-3-pro-preview`.
*   **AI Asset Generation**:
    *   **Images**: Generates photorealistic lab settings using `gemini-3-pro-image-preview`.
    *   **Audio**: Creates professional voiceovers using `gemini-2.5-flash-preview-tts`.
    *   **Video**: Animates static scenes into cinematic clips using `veo-3.1-generate-preview` (1080p).
*   **Protocol Search**: Integrated Google Search grounding to find and summarize experiments.
*   **Project Export**: JSON manifest export with royalty-free music selection.
*   **Access Control**: Free trial and access code system for restricted usage.

## Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Integration**: `@google/genai` SDK
*   **Icons**: Lucide React

## Getting Started

1.  **Environment Setup**:
    *   Ensure you have a valid Google AI Studio API Key.
    *   The app uses `process.env.API_KEY` for authentication.

2.  **Running the App**:
    *   Since this is a client-side React application, it can be served using any static file server or development environment (e.g., Vite).

## Access Control System

The application implements a "One-Time Free Trial" system.

1.  **New Users**: Upon first visit, users can start a free trial session. This grants immediate access but flags the device.
2.  **Returning Users**: Once the trial is used, the application locks and requires a valid Access Code.
3.  **Validation**: Codes are validated client-side against the list in `data/accessCodes.ts`.

### Managing Access Codes

To add or remove valid access codes, edit `data/accessCodes.ts`:

```typescript
export const VALID_ACCESS_CODES = [
  "LABGEN-BETA-2025",
  "NEW-CODE-HERE"
];
```

## Copyright

© Kevin Brian
