# VitalUp Frontend (Next.js)

## Description
VitalUp Frontend is a modern, responsive web application built with Next.js that provides an intuitive interface for health and wellness tracking. It features a clean design, real-time data visualization, and seamless integration with the VitalUp backend API.

## Tech Stack
- Next.js 15.3.1
- React 19.0.0
- TypeScript 5
- Tailwind CSS 4
- NextAuth.js 4.24.11 (Authentication)
- Axios 1.8.4 (API calls)
- Framer Motion 12.12.2 (Animations)
- React Toastify 11.0.5 (Notifications)

## Features
- 🔐 Secure user authentication
- 📊 Interactive health data dashboard
- 📱 Fully responsive design
- 🎨 Modern UI with smooth animations
- 🌐 Internationalization support
- ⚡ Optimized performance with Turbopack
- 🔔 Real-time notifications
- 📈 Data visualization and analytics

## Installation

### Prerequisites
- Node.js 18+ or higher
- npm, yarn, pnpm, or bun
- VitalUp Backend API running

### Setup Steps
1. Clone the repository
   ```bash
   git clone https://github.com/alghailaniyoussef/VitalUp_frontend.git
   cd VitalUp_frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Environment configuration
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure environment variables in `.env.local`
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXT_PUBLIC_APP_NAME=VitalUp
   ```

5. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── profile/           # User profile pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   └── layout/           # Layout components
├── context/              # React Context providers
├── utils/                # Utility functions
├── locales/              # Internationalization files
└── middleware.ts         # Next.js middleware
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

### Required Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Optional Variables
```env
NEXT_PUBLIC_APP_NAME=VitalUp
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## API Integration

The frontend connects to the VitalUp Backend via REST API. Key integration points:

- **Authentication**: JWT-based authentication with NextAuth.js
- **Data Fetching**: Axios for API calls with interceptors
- **Real-time Updates**: WebSocket connections for live data
- **Error Handling**: Centralized error handling with toast notifications

### API Configuration

API client is configured in `src/utils/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Deployment

### Vercel Deployment (Recommended)

This application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

#### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app/api
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXT_PUBLIC_APP_NAME=VitalUp
```

### Manual Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Start the production server
   ```bash
   npm run start
   ```

## Performance Optimization

- **Image Optimization**: Next.js Image component with automatic optimization
- **Code Splitting**: Automatic code splitting with dynamic imports
- **Caching**: Aggressive caching strategies for static assets
- **Bundle Analysis**: Use `@next/bundle-analyzer` to analyze bundle size
- **Turbopack**: Fast development builds with Turbopack

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards:
   - Use TypeScript for type safety
   - Follow ESLint rules
   - Write meaningful commit messages
   - Add tests for new features
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Extended from Next.js recommended config
- **Prettier**: Automatic code formatting
- **Tailwind CSS**: Utility-first CSS framework
- **Component Structure**: Functional components with hooks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Repositories

- [VitalUp Backend](https://github.com/alghailaniyoussef/VitalUp_backend) - Laravel backend API

## Support

For support and questions:
- Open an issue in the GitHub repository
- Contact the development team
- Check the [documentation](https://docs.vitalup.com)

## Roadmap

- [ ] Mobile app development (React Native)
- [ ] Offline functionality with PWA
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Multi-language support expansion
- [ ] Dark mode theme
