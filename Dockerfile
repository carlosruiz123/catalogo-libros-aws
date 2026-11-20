FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/carlosruiz123/catalogo-libros-aws"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production \
    PORT=3000

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
