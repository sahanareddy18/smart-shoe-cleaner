# Smart Shoe Cleaner

IoT-powered smart shoe cleaning and storage unit dashboard built with React + Vite.

## Features

- **Live Monitoring**: Real-time sensor data from ThingSpeak (Temperature, Humidity, Water Level)
- **Process Management**: Control and monitor cleaning cycles
- **Analytics**: Track water usage, energy consumption, and shoe health
- **Scheduling**: Set up automated cleaning schedules
- **Notifications**: Intelligent alerts for maintenance and cycle completion
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional):
   ```bash
   VITE_THINGSPEAK_CHANNEL_ID=your_channel_id
   ```

### Development

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment

### Netlify
1. Build the project: `npm run build`
2. Drag the `dist` folder to [Netlify](https://netlify.com)

### Vercel
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build
npm run deploy
```

## Project Structure

```
src/
├── components/       # React components
├── pages/           # Page components
├── context/         # React context for state management
├── constants/       # Project constants
└── assets/          # Static assets
```

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **ThingSpeak** - IoT data source
- **CSS Modules** - Styling

## License

MIT
