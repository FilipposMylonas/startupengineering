#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting FreedomPuff Development Servers${NC}"
echo 

# Start Django backend in the background
echo -e "${BLUE}Starting Django backend server on http://localhost:8000${NC}"
cd backend
source ../venv/bin/activate
python manage.py runserver &
DJANGO_PID=$!
cd ..

echo "Django server started with PID: $DJANGO_PID"
echo

# Give Django a moment to start up
sleep 2

# Start Next.js frontend
echo -e "${BLUE}Starting Next.js frontend server on http://localhost:3000${NC}"
# Run from the root directory directly
npm run dev &
NEXTJS_PID=$!

echo "Next.js server started with PID: $NEXTJS_PID"
echo

echo -e "${GREEN}Both servers are now running!${NC}"
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "Backend Admin: ${BLUE}http://localhost:8000/admin/${NC}"
echo
echo "Press Ctrl+C to stop both servers"

# Function to kill processes when the script is terminated
function cleanup {
    echo
    echo -e "${GREEN}Stopping servers...${NC}"
    kill $DJANGO_PID
    kill $NEXTJS_PID
    echo "Servers stopped"
    exit
}

# Register the cleanup function to be called on SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait for both processes
wait 