# FreedomPuff Website

![FreedomPuff Banner](/images/freedompuff-hero.jpg)

## Overview

FreedomPuff is a modern, interactive website showcasing an innovative electric ashtray product that captures smoke before it disperses into the air. Built with Next.js and Three.js, the site features immersive 3D animations, interactive product displays, and a clean, responsive design.

## Quick Start Guide

Follow these steps to set up and run the project from a fresh start:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd AshtrayWEB
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   # Backend dependencies
   pip install -r backend/requirements.txt
   
   # Frontend dependencies
   npm install
   ```

5. **Set up environment variables:**
   - Ensure `.env.local` exists in the root directory
   - Ensure `.env` exists in the backend directory
   - If needed, run the setup script:
     ```bash
     cd backend
     python setup_env.py
     cd ..
     ```

6. **Apply database migrations:**
   ```bash
   cd backend
   python manage.py migrate
   cd ..
   ```

7. **Start the development servers:**
   ```bash
   # Make the script executable (only needed once)
   chmod +x start-servers.sh
   
   # Run both frontend and backend
   ./start-servers.sh
   ```

8. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

## Deployment to Vercel

Follow these steps to deploy both the Django backend and Next.js frontend to Vercel:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Set up Stripe Keys in Vercel:**
   - Log into the [Vercel Dashboard](https://vercel.com/)
   - Select your project
   - Go to Settings > Environment Variables
   - Add the following variables:
     - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Troubleshooting Deployment Issues:**
   - If cookies aren't working properly, check the CORS settings in `backend/ashtray_project/settings.py`
   - For Stripe checkout issues, verify that you've set up the environment variables correctly
   - For 405 Method Not Allowed errors, check that the API routes in `vercel.json` are configured correctly

## Features

### 🌟 Immersive 3D Experiences
- Dynamic smoke simulation and particle effects
- Interactive 3D product models with realistic lighting
- Animated product showcases with GSAP-powered transitions

### 🎨 Modern UI Components
- SkyDive animation with floating words and clouds
- Interactive carousel for product variants
- Alternating text sections with synchronized 3D elements
- Responsive design across all device sizes

### ⚡ Technical Highlights
- Built with Next.js for optimal performance
- 3D rendering with Three.js and React Three Fiber
- Smooth animations powered by GSAP
- Custom hooks for responsive design
- Zustand for lightweight state management
- Django REST Framework backend

## Project Structure

```
AshtrayWEB/
├── src/                   # Frontend source code
│   ├── app/               # Next.js app directory
│   ├── components/        # Shared UI components
│   ├── hooks/             # Custom React hooks
│   └── slices/            # Page sections/slices
├── backend/               # Django backend
│   ├── api/               # Django REST API app
│   ├── ashtray_project/   # Django project settings
│   └── requirements.txt   # Python dependencies
├── public/                # Static assets
├── venv/                  # Python virtual environment
├── package.json           # Node dependencies
└── start-servers.sh       # Script to start both servers
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## More Information

For detailed information about the backend API, check the [backend README](backend/README.md).

## License

This project is licensed under the terms of the license included in the repository.
