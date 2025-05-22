/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "whatsapp-green": "#00a884",
        "light-green": "#dcf8c6",
        "chat-background": "#efeae2",
        "sidebar-background": "#ffffff",
        "sidebar-header": "#f0f2f5",
        "unread-bg": "#25d366",
        "chat-item-hover": "#f5f6f6",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
