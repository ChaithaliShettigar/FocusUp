/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f7f2e9',
        clay: '#e7ddcb',
        ink: '#1f2933',
        accent: '#f1b24a',
        mint: '#8bd3dd',
        leaf: '#7dcfb6',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(31, 41, 51, 0.12)',
      },
      backgroundImage: {
        'doodle-beige': "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22620%22 height=%22620%22 viewBox=%220 0 620 620%22%3E%3Cg fill=%22none%22 stroke=%22%23b8a183%22 stroke-width=%222.2%22 opacity=%220.23%22%3E%3Cpath d=%27M70 110c22-12 54-8 68 10 9 12 4 30-8 42-20 9-54 2-68-18-8-10-10-24 8-34Z%27/%3E%3Cpath d=%27M470 96c28 4 48 22 54 42 4 12 2 26-18 38-26 0-58-20-58-50 0-12 8-30 22-30Z%27/%3E%3Cpath d=%27M170 320c24-14 58-14 76 8 10 14 12 34-10 50-26 10-58 3-74-16-9-10-11-24 8-42Z%27/%3E%3Cpath d=%27M360 300c22-12 50-10 68 8 10 10 14 24-6 38-26 8-58 4-72-18-7-9-6-18 10-28Z%27/%3E%3Cpath d=%27M110 450c16-16 40-20 58-12 12 5 22 18 16 36-14 12-38 16-56 8-14-6-26-20-18-32Z%27/%3E%3Cpath d=%27M400 470c18-14 44-16 62-4 10 6 18 18 10 32-16 11-42 14-60 5-12-6-22-20-12-33Z%27/%3E%3Cpath d=%27M230 180c14-12 38-14 54-6 10 5 18 16 12 30-14 8-40 12-56 4-10-6-18-18-10-28Z%27/%3E%3Cpath d=%27M520 230c14-8 30-8 44 2 8 6 12 14 2 24-14 4-32 3-42-10-6-7-7-12-4-16Z%27/%3E%3Cpath d=%27M80 250c8-10 22-14 32-10 8 2 14 10 12 20-8 7-20 10-32 6-8-2-14-8-12-16Z%27/%3E%3Cpath d=%27M300 560c18-10 38-8 50 4 7 8 9 18-6 28-18 6-40 4-50-8-7-7-9-16 6-24Z%27/%3E%3Cpath d=%27M210 380c-4-14 10-26 28-34 14-6 32-8 40 8 4 12 2 28-18 36-14 7-38 8-50-10Z%27/%3E%3Cpath d=%27M460 380c-6-18 12-30 32-38 16-6 36-6 44 10 4 12 0 28-18 38-16 8-42 10-58-10Z%27/%3E%3C/g%3E%3Cg font-family=%22Verdana%22 font-size=%2230%22 fill=%22%23b8a183%22 opacity=%220.27%22%3E%3Ctext x=%2290%22 y=%2290%22%3E%F0%9F%93%9A%3C/text%3E%3Ctext x=%22480%22 y=%2290%22%3E%F0%9F%93%9D%3C/text%3E%3Ctext x=%22140%22 y=%22330%22%3E%F0%9F%92%A1%3C/text%3E%3Ctext x=%22360%22 y=%22310%22%3E%F0%9F%93%9D%3C/text%3E%3Ctext x=%2290%22 y=%22470%22%3E%F0%9F%8E%93%3C/text%3E%3Ctext x=%22390%22 y=%22485%22%3E%F0%9F%93%88%3C/text%3E%3Ctext x=%22210%22 y=%22195%22%3E%F0%9F%92%BB%3C/text%3E%3Ctext x=%22505%22 y=%22245%22%3E%F0%9F%94%8D%3C/text%3E%3Ctext x=%2280%22 y=%22260%22%3E%F0%9F%93%96%3C/text%3E%3Ctext x=%22295%22 y=%22585%22%3E%F0%9F%94%8A%3C/text%3E%3C/g%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}
