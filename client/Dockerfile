# ---- Frontend image: build with Vite, serve with nginx ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# API is reached via the nginx reverse proxy at /api.
ENV VITE_API_URL=/api
RUN npm run build

# ---- Serve ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
