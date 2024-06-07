FROM node:20.2-slim

RUN useradd -m devcontainer

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y curl python3 python3-pip

# for lapack
RUN apt-get install -y libblas-dev liblapack-dev liblapacke-dev

WORKDIR /app

CMD ["yarn", "run", "build"]
