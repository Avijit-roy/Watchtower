/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Severity colors — defined once here, referenced via constants.js in components.
      // Chosen to match ops/SRE industry conventions:
      //   SEV1 = red (critical), SEV2 = orange, SEV3 = yellow, SEV4 = blue (low)
      colors: {
        sev1: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', badge: '#EF4444' },
        sev2: { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74', badge: '#F97316' },
        sev3: { bg: '#FEFCE8', text: '#854D0E', border: '#FDE047', badge: '#EAB308' },
        sev4: { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD', badge: '#3B82F6' },
      },
      fontFamily: {
        // Inter for UI chrome (headings, nav, labels)
        // JetBrains Mono for timeline entries and postmortem content (monospaced ops feel)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
