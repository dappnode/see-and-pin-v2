FROM node:18.3.0-alpine AS builder
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn

COPY . .

RUN yarn build


FROM node:18.3.0-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --production

COPY --from=builder /usr/src/app/build ./build


ENTRYPOINT [ "node", "build/index.js" ]