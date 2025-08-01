# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY code_base/crm_ui/package*.json ./

# Install all dependencies (including dev dependencies needed for building)
RUN npm ci

# Copy source code
COPY code_base/crm_ui/ ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from build stage (Create React App outputs to 'build' directory)
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
