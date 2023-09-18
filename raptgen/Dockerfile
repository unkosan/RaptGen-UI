FROM nvidia/cuda:11.8.0-devel-ubuntu22.04

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y git curl vim wget ghostscript

COPY --from=condaforge/mambaforge:latest /opt/conda /opt/conda

RUN mkdir /usr/share/fonts/opentype/noto \
 && wget https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTC/NotoSansCJK-Bold.ttc \
 && mv NotoSansCJK-Bold.ttc /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc

COPY ./environment.yml environment.yml
RUN /opt/conda/bin/mamba env create -f environment.yml

RUN echo "conda activate raptgen" >> ~/.bashrc
ENV CONDA_DEFAULT_ENV raptgen
# RUN pre-commit install -t pre-push # for testing before push
ENV PATH /opt/conda/envs/raptgen/bin:$PATH
ENV PYTHONPATH /app

WORKDIR /app

CMD [ "python3" ]