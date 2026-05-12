FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
