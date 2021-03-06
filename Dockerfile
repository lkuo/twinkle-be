FROM node:12.14.1-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "run", "prod"]

