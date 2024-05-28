ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine as build
WORKDIR /opt

COPY package.json package-lock.json tsconfig.json tsconfig.compile.json .barrelsby.json .babelrc prisma ./

RUN npm ci

COPY ./src ./src

RUN npx prisma generate

RUN npm run build

FROM node:${NODE_VERSION}-alpine as runtime
ENV WORKDIR /opt
WORKDIR $WORKDIR

RUN apk update && apk add build-base git curl
RUN npm install -g pm2 ts-node typescript

COPY --from=build /opt .

RUN npm install

COPY . .

COPY .env /opt/.env

EXPOSE 8081
ENV PORT 8081
ENV NODE_ENV production

CMD ["sh", "-c", "npx prisma migrate dev --name init && npx prisma db seed || true && pm2-runtime start processes.config.js --env production"]
