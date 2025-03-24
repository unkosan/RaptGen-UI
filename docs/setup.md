# Installation

## Preliminaries

Please check if the Docker is installed. like

```shell
$ docker -v
Docker version 20.10.21, build baeda1f
```

## Procedure

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

!!! Warning
    If you send `down` command, containers and database will be removed.
    If you want to keep the data, please make sure to use `stop` command.
