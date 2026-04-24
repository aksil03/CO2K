FROM node:22.14.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_URL
ARG DIRECT_URL

RUN DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    npx prisma generate

EXPOSE 5173

CMD ["npm","run","dev"]

