<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1W568SnCUSWLa03mywZpmRluH3XCQ6bA6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create your environment file:
   - Create a new file named `.env` in the root directory (next to `package.json`).
   - Paste the following content into it, replacing `YOUR_API_KEY_HERE` with your actual Google Gemini API key:
     ```
     VITE_GOOGLE_API_KEY=YOUR_API_KEY_HERE
     ```
   - (Optional) You can also copy `env.example` to `.env` if the file is available.
3. Run the app:
   `npm run dev`