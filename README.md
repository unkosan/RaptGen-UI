<div align="center">
   <img src="docs/images/logo.png" alt="RaptGen-UI" width="400"><br>
   The GUI for RaptGen developed with React and FastAPI
</div>

## What is RaptGen-UI?

RaptGen-UI is a web-based user-friendly interface for RaptGen, a powerful Latent Space Bayesian Optimization (LSBO) method for identifying and optimizing aptamers from high-throughput SELEX data. For more information about RaptGen, please refer to the [RaptGen paper](https://doi.org/10.1038/s43588-022-00249-6).

## Overview

<p align="center">
   <img src="docs/images/overview.png" alt="Overview of RaptGen-UI pipeline"><br>
</p>

Currently, RaptGen-UI supports four modules: Viewer, VAE Trainer, GMM Trainer, and Bayesian Optimization.
Users first need to upload their data and then run VAE Trainer module. After that, users can inquire the latent space of the uploaded data by Viewer module, or run GMM Trainer module to get clustering results. Finally, users can use Bayesian Optimization module to optimize aptamers.

For more information about its usage, please click the following links.

- [Viewer](docs/viewer.md)
- [VAE Trainer](docs/vae-trainer.md)
- [GMM Trainer](docs/gmm-trainer.md)
- [Bayesian Optimization](docs/bayesian-optimization.md)

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

## License

This project is licensed under the [MIT License](LICENSE).
