FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package.json ./
COPY lib ./lib
COPY public ./public
COPY server.mjs ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s CMD wget -qO- http://127.0.0.1:3000/salud || exit 1
CMD ["node", "server.mjs"]
