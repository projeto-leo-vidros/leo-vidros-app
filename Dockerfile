# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_BACKEND_URL=/api
ARG VITE_MAPS_KEY
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_MAPS_KEY=${VITE_MAPS_KEY}

RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80