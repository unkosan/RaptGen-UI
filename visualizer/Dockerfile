FROM node:lts-buster-slim

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y curl

WORKDIR /app

CMD ["npm", "run", "build"]