/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // hỗ trợ dark mode bằng class (đã có sẵn trong code của bạn)
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Bạn có thể thêm màu accent cho sự kiện nếu muốn (ví dụ indigo/purple)
        accent: {
          500: '#6366f1', // indigo-500
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['"Open Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'], // override default sans
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px', // thêm cho card/event nếu cần
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
        large: '0 8px 24px rgba(0, 0, 0, 0.16)',
        // thêm shadow neon nhẹ cho sự kiện (tùy chọn)
        'event-glow': '0 0 20px rgba(99, 102, 241, 0.25)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
}