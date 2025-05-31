import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'background-secondary': 'hsl(var(--background-secondary))',
        'foreground-secondary': 'hsl(var(--foreground-secondary))',
        'chat-user': 'hsl(var(--chat-user))',
        'chat-user-foreground': 'hsl(var(--chat-user-foreground))',
        'chat-assistant': 'hsl(var(--chat-assistant))',
      },
    },
  },
  plugins: [],
}

export default config