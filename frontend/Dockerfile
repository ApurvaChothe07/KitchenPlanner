# Multi-stage Dockerfile for KitchenCraft React Frontend
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (using npm install because rollup patch is in postinstall)
RUN npm install

# Copy source code and build Vite bundle
COPY . .
RUN npm run build

# Stage 2: Hardened Nginx runtime stage
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
