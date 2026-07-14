# SONA SCALE UWA Chatbot Widget Documentation

This documentation provides details on how to integrate the SONA SCALE UWA Admissions Chatbot into any external HTML website, how it works under the hood, and how to maintain it.

---

## 🚀 1. Installation Guide

To add the chatbot to any website, copy and paste the single line of code below right before the closing `</body>` tag of your HTML pages:

```html
<script src="https://chatbot-widjet.vercel.app/embed.js" defer></script>
```

That's it! The script will automatically load the chatbot widget, position it in the bottom-right corner, and display the "Chat with me" launcher button.

---

## 🛠️ 2. How the Widget Works (Architecture)

The widget uses a modern **Iframe Injection Strategy** to combine the benefits of script embeds with style isolation.

1. **Self-Contained Environment (Iframe):** 
   The script dynamically creates an `iframe` pointing to the deployed Vercel application (`https://chatbot-widjet.vercel.app`). This isolates the chatbot's styles (Tailwind v4) and React components from the host website, preventing design conflicts.
   
2. **Resizing Controller (`embed.js`):**
   The host website runs `embed.js` to manage the widget's container size:
   - **Closed State (180px x 140px):** Tiny footprint, only big enough to display the launcher bubble and the "Chat with me" tooltip without blocking other clicks on the site.
   - **Open State (430px x 670px):** Expanded viewport to accommodate the full chat modal.
   - **Mobile Responsiveness:** Detects device size dynamically. If the user is on mobile (width <= 450px), the iframe scales to full screen (`100vw` x `100vh`) for easy reading, and goes back to a button when closed.

3. **Cross-Origin Communication (`postMessage`):**
   The Next.js app communicates state changes (`open` / `closed`) to the host page using secure HTML5 `postMessage` calls, letting the host page know when to resize the iframe.

4. **Future-Proof Updates:**
   Whenever you push changes to your GitHub repository, Vercel automatically redeploys. Since the script loads your live Vercel URL, **all updates (prompts, logos, colors, features) will instantly reflect on all websites using the script tag.**

---

## ⚙️ 3. Personalization & Settings

The widget properties can be customized directly in the Next.js codebase:

| Customization Task | File Location | Property to Edit |
|---|---|---|
| **AI Knowledge / Prompt** | [`lib/datasets/sona-star-faq.ts`](file:///c:/Users/24aiml31/New%20folder/chatbot-widjet-sona-star/lib/datasets/sona-star-faq.ts) | Edit `sonaStarKnowledgeBasePrompt` text |
| **Watermark Image** | `public/Gemini_Generated_Image_ewigp1ewigp1ewig.png` | Replace this file with your custom background |
| **Closed State Icon** | [`components/assistant-ui/assistant-modal.tsx`](file:///c:/Users/24aiml31/New%20folder/chatbot-widjet-sona-star/components/assistant-ui/assistant-modal.tsx) | Edit the `<svg>` tag inside `ModalButton` |
| **Header Right Logo** | `public/1000183522.png` | Replace this file with your custom brand logo |
| **Primary Theme Colors** | [`app/globals.css`](file:///c:/Users/24aiml31/New%20folder/chatbot-widjet-sona-star/app/globals.css) | Modify `--primary` (Sona Red) or `--secondary` (Sona Teal) variables |

---

## 📊 4. Prompt to Generate a Presentation (PPT)

Use the prompt below in **ChatGPT, Claude, or Google Gemini** to write a complete slide deck outline, which you can then export to PowerPoint or Google Slides:

```text
Act as a professional technical product manager and developer. Write a comprehensive, slide-by-slide presentation deck outline (PPT structure) for the "SONA SCALE UWA Admissions Chatbot Widget". 

The presentation should be designed for stakeholders and marketing teams. Provide slide titles, core talking points, visual layouts, and suggested screenshots for each slide.

Here is the exact project context to include in the slides:
- **Core Purpose:** Automate admissions support and lead generation for the MS in Data Science 1+1 International Pathway Program (Year 1 at SCALE Bengaluru, Year 2 at UWA Alabama).
- **Features Implemented:**
  1. *Greeting Flow:* Welcomes users, collects name, and dynamically routes them to their preferred language.
  2. *Lead Capture Form:* Gathers Name, Email, and Phone. It can be skipped using the 'ESC' key or close button.
  3. *AI Name Personalization:* Stores the user's name in a cookie, which is read by the backend API. The system prompt dynamically updates so the AI addresses the user by their actual name instead of a placeholder.
  4. *Language Support:* Multilingual selectors for English, Tamil, Kannada, and Hindi.
  5. *Voice Support:* Voice mic button built-in for speaking messages.
  6. *Custom Design:* Glassmorphic message bubbles with high contrast, a custom watermark background (40% opacity), a red robot AI icon on the left of the header, and the SONA logo on the right.
- **Embedded Architecture:** 
  - Host websites copy-paste a single script: `<script src="https://chatbot-widjet.vercel.app/embed.js" defer></script>`.
  - The script injects an isolated `iframe` to prevent CSS style leakage.
  - The iframe auto-resizes dynamically via `postMessage` cross-origin events:
    - *Closed State:* `180px` x `140px` (provides space for the launcher button and the "Chat with me" tooltip without blocking host website clicks).
    - *Open State:* `430px` x `670px` (fits the full chat window).
- **Technical Stack:** Next.js App Router (React 19), Tailwind CSS v4, Lucide Icons, `@assistant-ui/react` UI SDK, Google Gemini 2.5 Flash API, and Vercel Deployment.

Use the following slide-by-slide structure:
- Slide 1: Title Slide (Title: "SONA SCALE UWA Admissions Chatbot Widget", Subtitle: "Automating Student Support & Enrollment for the MS in Data Science 1+1 International Pathway Program", Presenter: "SCALE Bengaluru Admissions Team")
- Slide 2: The Challenge (Why admissions queries are hard to handle manually and the need for 24/7 automation)
- Slide 3: Introducing the SONA SCALE UWA Chatbot (Core purpose: 1+1 International Pathway program assistant)
- Slide 4: Key Features & Capabilities (Gemini AI intelligence, lead capture forms, multilingual support, voice recognition, custom branding)
- Slide 5: Embedded Integration Architecture (Explain the embed.js script, iframe isolation, auto-resizing controller, and zero-maintenance updates)
- Slide 6: User Journey Flow (Greeting -> Contact Form -> Language Preference -> Interactive Q&A)
- Slide 7: Visual Customizations (Custom branding: Sona brand logos, custom AI icons, watermark, and high-contrast bubble styling)
- Slide 8: Technical Stack (Next.js, Tailwind CSS v4, @assistant-ui/react, Vercel deployment, Biome, and Gemini 2.5 Flash API)
- Slide 9: Implementation Code (Show the simple script tag copy-paste integration code)
- Slide 10: Conclusion & Next Steps (Contact Info: sonauwa@sonastar.com / +91 9442592170, Deployment: Live on Vercel, Integration Status: Ready for Production)

Format the output clearly with Slide Headings, Visual Guidance, and slide content.
```
