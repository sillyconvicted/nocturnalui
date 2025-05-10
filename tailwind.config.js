// Add Monaco editor colors to safelist to prevent purging

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-[#121212]',
    'bg-[#0e0e0e]',
    'bg-[#1e1e1e]',
    'bg-[#252526]',
    'text-[#FFFFFF]',
    'text-[#C586C0]',
    'text-[#569CD6]',
    'text-[#4EC9B0]',
    'text-[#4FC1FF]',
    'text-[#DCDCAA]',
    'text-[#6A9955]',
    'text-[#CE9178]',
    'text-[#D7BA7D]',
    'text-[#B5CEA8]',
    'text-[#D4D4D4]'
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#121212',
          text: '#FFFFFF',
          keyword: '#C586C0',
          function: '#DCDCAA',
          string: '#CE9178',
          number: '#B5CEA8',
          comment: '#6A9955',
          operator: '#D4D4D4',
          roblox: '#4EC9B0',
          executor: '#4FC1FF'
        }
      },
      animation: {
        'contextMenuFadeIn': 'contextMenuFadeIn 0.15s ease-out forwards',
      },
      keyframes: {
        contextMenuFadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
