#!/bin/sh

# Wait for the PostgreSQL server to be available
while ! nc -z db 5432; do
  echo "Waiting for the PostgreSQL server to be available..."
  sleep 1
done

# Run the database migrations
flask db init
flask db migrate -m "Initial migration."
flask db upgrade

# Run the Flask application
exec flask run --host=0.0.0.0 --reload
