FROM node:12-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:12-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

ENV TZ=America/Toronto
ENV NODE_ENV=production

COPY --from=builder /app/build ./build
CMD npm start
