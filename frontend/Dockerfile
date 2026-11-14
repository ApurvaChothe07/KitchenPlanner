# Multi-stage Dockerfile for KitchenCraft React Frontend
# =========================================================
# Stage 1: Build stage
# =========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Configurable backend API URL during Vite build
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (runs postinstall script for rollup wasm patch)
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# =========================================================
# Stage 2: Hardened Nginx runtime stage
# =========================================================
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration with SPA fallback and API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
