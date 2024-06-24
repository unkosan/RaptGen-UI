FROM --platform=linux/arm64 condaforge/mambaforge

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y git curl vim wget ghostscript \
        g++ make libboost-program-options-dev libboost-random-dev libboost-system-dev

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get install -y autoconf automake libtool
RUN apt-get install -y cmake pkg-config build-essential libmpfr-dev gfortran libatlas3-base libatlas-base-dev liblapacke-dev

# install vienna-rna needed for centroid_rna_package
RUN wget https://github.com/ViennaRNA/ViennaRNA/releases/download/v2.6.4/ViennaRNA-2.6.4.tar.gz \
    && tar -zxvf ViennaRNA-2.6.4.tar.gz \
    && cd ViennaRNA-2.6.4 \
    && ./configure --without-swig \
    && make \
    && make install

# install centroid_rna_package
RUN git clone https://github.com/satoken/centroid-rna-package  \
    && cd centroid-rna-package \
    && mkdir build && cd build \
    && cmake -DCMAKE_BUILD_TYPE=Release .. \
    && make \
    && make install 

# font for weblogo
RUN mkdir /usr/share/fonts/opentype/noto \
    && wget https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTC/NotoSansCJK-Bold.ttc \
    && mv NotoSansCJK-Bold.ttc /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc

COPY ./environment-mps.yml environment.yml
RUN mamba env create -f environment.yml


RUN echo "conda activate raptgen" >>~/.bashrc
ENV CONDA_DEFAULT_ENV raptgen
# RUN pre-commit install -t pre-push # for testing before push
ENV PATH /opt/conda/envs/raptgen/bin:$PATH
ENV PYTHONPATH /app

WORKDIR /app
ENV PYTEST_PLUGINS=celery.contrib.pytest

CMD [ "python3" ]
