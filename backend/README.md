# Backend API (Django)

This directory contains the Django backend API for the AshtrayWEB application.

## Fresh Start Setup

Follow these steps to set up and run the project from a fresh start:

1. Clone the repository and navigate to the project root directory (not the backend directory):
   ```bash
   git clone <repository-url>
   cd AshtrayWEB
   ```

2. Create a virtual environment in the root directory:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

5. Install frontend dependencies:
   ```bash
   npm install
   ```

6. Set up environment variables:
   - Make sure you have `.env.local` in the root directory for frontend environment variables
   - Make sure you have `.env` in the backend directory for backend environment variables
   - If you don't have these files, you can run the setup script:
     ```bash
     cd backend
     python setup_env.py
     cd ..
     ```

7. Apply database migrations:
   ```bash
   cd backend
   python manage.py migrate
   cd ..
   ```

8. Start both frontend and backend servers:
   ```bash
   # Make the start script executable (only needed once)
   chmod +x start-servers.sh
   
   # Run the servers
   ./start-servers.sh
   ```

## Starting Individual Servers

To start only the backend server:
```bash
cd backend
python manage.py runserver
```

To start only the frontend server:
```bash
npm run dev
```

## Project Structure

- `ashtray_project/` - Main Django project directory
  - `settings.py` - Project settings
  - `urls.py` - Main URL routing
- `api/` - Django app for the REST API
  - `models.py` - Database models
  - `serializers.py` - Django REST Framework serializers
  - `views.py` - API endpoints
  - `urls.py` - API URL routing

## Environment Variables

The backend requires the following environment variables in the `.env` file:
- `SECRET_KEY` - Django secret key
- `STRIPE_PUBLISHABLE_KEY` - Public Stripe API key
- `STRIPE_SECRET_KEY` - Secret Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Secret for Stripe webhooks
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts
- `PRODUCTION_DOMAINS` - Comma-separated list of production domains (for CORS and cookie settings)

> **Note:** This application uses Stripe for payment processing. The Stripe Python package is required and will be installed with the other dependencies.

## Troubleshooting

If you encounter any issues:

1. Make sure you're using the virtual environment in the root directory
2. Verify that all dependencies are installed correctly
3. Check that environment variables are set properly
4. Make sure the database migrations are applied

For database-related issues, you may need to reset the database:
```bash
cd backend
rm db.sqlite3
python manage.py migrate
cd ..
```