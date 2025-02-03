<div align="center">
   <img src="docs/images/logo.png" alt="RaptGen-UI" width="400"><br>
   The GUI for RaptGen developed with React and FastAPI
</div>

## How to Launch

### Preliminaries

Please check if the Docker is installed. like

```shell
$ docker -v
Docker version 20.10.21, build baeda1f
```

### Procedure

1. Open your terminal. If you would like to run this application on a remote server, use SSH with port-forwarding.
   ```shell
   $ ssh -L 18042:localhost:18042 username@hostname.com
   ```
   Otherwise, skip this step.
2. Clone this repository wherever you want, then go into `RaptGen-UI` directory.
   ```shell
   $ git clone https://github.com/hmdlab/RaptGen-UI.git
   $ cd RaptGen-UI
   ```
3. Build and run containers with following docker-compose.
   ```shell
   $ docker compose up -d
   ```
   If you have GPU devices which supports CUDA, run with `docker-compose.gpu.yml` file instead.
   ```shell
   $ docker compose -f docker-compose.gpu.yml up -d
   ```
4. Please wait before all the containers are ready. This may take a few minutes. Even if Docker says they are ready, it may take some extra time for the `frontend` container to be working.
5. Access http://localhost:18042 with your favorite internet browser.
6. If you would like to stop the containers, please type the following command. This stops containers and all data will be retained in `db` container.
   ```shell
   $ docker compose stop
   ```

> [!WARNING]
> If you send `down` command, containers and database will be removed.
> If you want to keep the data, please make sure to use `stop` command.

## Overview

For now, `Viewer`, `VAE Trainer`, `GMM Trainer`, and `Bayesian Optimization` modules are available.

For more information about its usage, please click the following links.

### [Viewer](docs/Viewer.md)

Visualize the latent map of the HT-SELEX data.

![View of Viewer](docs/images/viewer.png)

### [VAE Trainer](docs/VAE_Trainer.md)

Train a VAE model on HT-SELEX data.

![View of VAE Trainer](docs/images/vae-trainer.png)

### [GMM Trainer](docs/GMM_Trainer.md)

Train a GMM model on latent space of HT-SELEX data.

![View of GMM Trainer](docs/images/gmm-trainer.png)

### [Bayesian Optimization](docs/BO.md)

Optimize aptamers using Bayesian Optimization.

![View of Bayesian Optimization](docs/images/bo.png)

## Tech Stacks

**Frontend**
<br>
<img src="https://img.shields.io/badge/TypeScript--007ACC.svg?logo=typescript&style=flat">
<img src="https://img.shields.io/badge/Next.js--000000.svg?logo=next.js&style=flat">
<img src="https://img.shields.io/badge/Bootstrap--7952B3.svg?logo=bootstrap&style=flat">
<img src="https://img.shields.io/badge/Redux--764ABC.svg?logo=redux&style=flat">
<img src="https://img.shields.io/badge/Plotly.js--3F4F75.svg?logo=plotly&style=flat">
<img src="https://img.shields.io/badge/React Data Grid--42B883.svg?logo=react&style=flat">

**Backend**
<br>
<img src="https://img.shields.io/badge/Python--3776AB.svg?logo=python&style=flat">
<img src="https://img.shields.io/badge/FastAPI--009688.svg?logo=fastapi&style=flat">
<img src="https://img.shields.io/badge/PyTorch--EE4C2C.svg?logo=pytorch&style=flat">
<img src="https://img.shields.io/badge/Celery--37814A.svg?logo=celery&style=flat">

**Database**
<br>
<img src="https://img.shields.io/badge/PostgreSQL--4169E1.svg?logo=postgresql&style=flat">
<img src="https://img.shields.io/badge/Redis--DC382D.svg?logo=redis&style=flat">

**Deployment**
<br>
<img src="https://img.shields.io/badge/Docker Compose--2496ED.svg?logo=docker&style=flat">

## License

This project is licensed under the MIT License.
