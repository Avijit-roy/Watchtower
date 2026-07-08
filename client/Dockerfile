# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY client/package.json ./client/

# Install dependencies for client
RUN npm ci -w client

# Copy the rest of the client source files
COPY client/ ./client/

# Build argument for the API URL during Vite build
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the production bundle
RUN npm run build -w client

# Stage 2: Serve static files using Nginx
FROM nginx:alpine

# Copy built assets from Stage 1 to Nginx default public directory
COPY --from=build /app/client/dist /usr/share/nginx/html

# Expose port 80 internally
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
