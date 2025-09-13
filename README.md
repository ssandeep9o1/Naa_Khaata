# Naa Khaata

## 📌 About

**Naa Khaata** is a modern **React + TypeScript** web application built with **Vite**.  
It leverages **Material UI (MUI)**, **Framer Motion**, **Recharts**, and **Supabase** to deliver a responsive, animated, and data-driven experience.  
Think of it as a **digital ledger / account management system** where you can manage records with ease (💡 update this line with your exact project description).

---

## ✨ Features

- ⚡ Lightning-fast development with **Vite**  
- 🎨 Beautiful UI with **Material UI** and **Emotion** styling  
- 📊 Interactive data visualization using **Recharts**  
- 🎬 Smooth animations powered by **Framer Motion**  
- 🔑 Authentication & backend integration with **Supabase**  
- 🌐 Client-side routing with **React Router v7**  
- 🖋 Custom fonts: **Inter** and **Poppins**  

---

## 🛠 Tech Stack

| Layer | Tools / Libraries |
|-------|-------------------|
| Frontend | React 19, React DOM, React Router DOM |
| Styling | Material UI (MUI), Emotion, Fontsource (Inter, Poppins) |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend / Auth | Supabase |
| Build Tool | Vite 7 |
| Language | TypeScript 5 |
| Linting | ESLint, React Hooks ESLint Plugin, TypeScript ESLint |

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- **Node.js** (v18 or above recommended)  
- **npm** or **yarn** package manager  

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ssandeep9o1/Naa_Khaata.git
2. Navigate to the project directory:
   ```bash
   cd Naa_Khaata
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
4. Create a .env file in the root directory and add your environment variables (for Supabase and other services):
   ```bash
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev

6. Build for production:
   ```bash
   npm run build
   # or
   yarn build

7. Preview the production build:
    ```bash
    npm run preview

8. 📂 Project Structure
       Naa_Khaata/
    │── public/              # Static assets
    │── src/                 
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Application pages (routed)
    │   ├── assets/          # Fonts, images, icons
    │   ├── hooks/           # Custom React hooks
    │   ├── utils/           # Utility/helper functions
    │   ├── App.tsx          # Main app component
    │   ├── main.tsx         # Application entry point
    │   └── router.tsx       # React Router configuration
    │
    │── .eslintrc.js         # ESLint configuration
    │── tsconfig.json        # TypeScript configuration
    │── vite.config.ts       # Vite configuration
    │── package.json         # Project dependencies & scripts

9. 📖 Usage

  Start the dev server and open the app in your browser (http://localhost:5173 by default).
  Register/login with Supabase authentication.
  Manage your records, view charts, and interact with the UI.

License: [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)





   
