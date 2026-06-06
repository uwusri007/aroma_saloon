FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY database ./database
COPY src ./src
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && mkdir -p uploads

EXPOSE 5000

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
