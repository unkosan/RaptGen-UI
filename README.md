# RaptGen UI

The GUI for RaptGen developed with React and FastAPI.

## How to Launch

### Preliminaries

Please check if the Docker is installed. like

```shell
$ docker -v
Docker version 20.10.21, build baeda1f
```

### Procedure

1. Export your UID and GID environmental variables (needed for the `worker` container to work successfully)
   ```shell
   $ export UID GID
   ```
2. build and run containers with docker-compose. You need to assign the `docker-compose.prod.yml` file.
   ```shell
   $ docker compose -f docker-compose.prod.yml up -d
   ```
3. Please wait before all the containers are ready. This may take a few minutes. Even if Docker says all the containers are ready, it may take some extra time for the `frontend` container to be working.
4. Access http://localhost:3000 with your favorite internet browser.

## Usage

For now, four application is available. They are `Viewer`, `VAE Trainer`, `GMM Trainer`, and `Bayesian Optimization`. For more information, please refer to the following links.

### Viewer

Visualize the latent map of the HT-SELEX data.

You can encode a single nucleotide sequence or batch sequences from fasta file. However decoding from a batch coordinates file is not supported.
Downloading is also supported. You can select which cluster to download.

![View of Viewer](docs/images/viewer.png)

### [VAE Trainer](docs/VAE_Trainer.md)

Train a VAE model with the HT-SELEX data. 

![VAE Trainer View](docs/images/vae_trainer.png)

### GMM Trainer

Train a GMM model with the HT-SELEX data.

![GMM Trainer View](docs/images/gmm.png)

### Bayesian Optimization

Optimize the HT-SELEX data with Bayesian Optimization.

![Bayesian Optimization View](docs/images/bo.png)