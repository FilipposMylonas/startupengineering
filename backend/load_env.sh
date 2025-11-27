#!/bin/bash

# Load environment variables from .env file in project root
ENV_FILE="../.env"

if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from .env file..."
    
    # Export each variable from the .env file
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^\# && -n "$line" ]]; then
            # Export the variable
            export "$line"
            
            # Print masked version for sensitive data
            key=$(echo "$line" | cut -d= -f1)
            echo "Set $key"
        fi
    done < "$ENV_FILE"
    
    echo "Environment variables loaded successfully."
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Run the command passed as arguments
if [ $# -gt 0 ]; then
    exec "$@"
fi 