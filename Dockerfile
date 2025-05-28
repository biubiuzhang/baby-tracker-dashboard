# Step 1: Build React
FROM node:18 AS frontend-builder
WORKDIR /app
COPY frontend/ /app
RUN npm install && npm run build

# Step 2: Backend + Nginx
FROM python:3.11-slim

WORKDIR /app

# Copy backend
COPY backend/ /app/backend

# Copy built React frontend for Vite
COPY --from=frontend-builder /app/dist /app/backend/static

# Install Python deps
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Install nginx
RUN apt-get update && apt-get install -y nginx netcat-openbsd && apt-get clean


# Copy nginx config
COPY nginx/default.conf /etc/nginx/sites-available/default

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
