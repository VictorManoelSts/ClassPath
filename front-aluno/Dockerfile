FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG API_URL=http://localhost:8080/api
ARG MATERIAIS_API_URL=http://localhost:8000/api
ARG PERIODO=2026.2

ENV API_URL=$API_URL
ENV MATERIAIS_API_URL=$MATERIAIS_API_URL
ENV PERIODO=$PERIODO

RUN npm run config && npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/front-aluno/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
