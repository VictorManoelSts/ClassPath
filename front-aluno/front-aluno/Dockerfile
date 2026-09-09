FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8080/api
ARG VITE_PERIODO=2026.2

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PERIODO=$VITE_PERIODO

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]