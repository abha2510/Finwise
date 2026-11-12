FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_OKTA_ISSUER
ARG VITE_OKTA_CLIENT_ID
ARG VITE_API_URL
ENV VITE_OKTA_ISSUER=$VITE_OKTA_ISSUER \
    VITE_OKTA_CLIENT_ID=$VITE_OKTA_CLIENT_ID \
    VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
