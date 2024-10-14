FROM --platform=amd64 nvidia/cuda:11.6.1-runtime-ubuntu20.04

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y git curl vim wget ghostscript

RUN mkdir /usr/share/fonts/opentype/noto \
    && wget https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTC/NotoSansCJK-Bold.ttc \
    && mv NotoSansCJK-Bold.ttc /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc

COPY --from=condaforge/mambaforge /opt/conda /opt/conda

COPY ./environment-gpu.yml environment.yml
RUN /opt/conda/bin/mamba env create -f environment.yml

RUN echo "conda activate raptgen" >>~/.bashrc
ENV CONDA_DEFAULT_ENV raptgen
# RUN pre-commit install -t pre-push # for testing before push
ENV PATH /opt/conda/envs/raptgen/bin:$PATH
ENV PYTHONPATH /app

WORKDIR /app
ENV PYTEST_PLUGINS=celery.contrib.pytest

CMD [ "python3" ]
