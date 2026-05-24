# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite app to static assets ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# VITE_* vars are baked in at build time. This must point to a backend URL the
# user's browser can reach (defaults to the published backend port on the host).
ARG VITE_WS_URL=http://localhost:3001
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# --- Serve stage: static files behind nginx ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
