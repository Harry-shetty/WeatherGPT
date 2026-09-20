# ⛅ WeatherGPT

WeatherGPT is a highly knowledgeable, conversational AI assistant specialized in meteorology, climate patterns, and weather alerts. It leverages the power of Google's Gemini API to provide intelligent, concise, and straight-to-the-point weather insights.

## ✨ Features

- **🧠 Conversational AI:** Get real-time weather information, climate explanations, and forecasts by chatting with the built-in Gemini AI model.
- **🗺️ Interactive Weather Map:** Explore a global, interactive weather map built with React Leaflet.
- **🚨 Live Active Alerts:** Stay safe with real-time fetch integrations for public weather and disaster alerts (NDMA integration).
- **🌪️ 3D Particle Morphing:** Enjoy a beautiful, dynamic Three.js particle system on the landing page that transitions smoothly between cloud, rain, and tornado states based on cursor movement.
- **🌗 Light & Dark Mode:** Fully responsive Glassmorphic design that adapts to your system theme, complete with auto-adjusting 3D element styling.
- **🚀 Ultra-Fast:** Built with React 19, Tailwind CSS v4, and bundled by Vite for a lightning-fast experience.

## 🛠️ Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Integration:** [Google Generative AI (Gemini 3.6 Flash)](https://ai.google.dev/)
- **Maps:** [React Leaflet](https://react-leaflet.js.org/)
- **3D Graphics:** [Three.js](https://threejs.org/)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Harry-shetty/WeatherGPT.git
cd WeatherGPT
```

2. Install the dependencies for the frontend:
```bash
cd frontend
pnpm install
```

3. Set up your environment variables:
Create a `.env.local` file inside the `frontend` directory and add your Google Gemini API key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
pnpm run dev
```

The app will now be running on `http://localhost:8443`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Harry-shetty/WeatherGPT/issues).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).

