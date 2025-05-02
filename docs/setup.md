# Installation

## Preliminaries

Please check if the Docker compose is installed on your machine.

```shell
$ docker -v     
Docker version 25.0.3, build 4debf41
$ docker compose version  
Docker Compose version v2.24.5-desktop.1
```

If you don't have Docker compose, please install it.

[Official Docker Compose Installation Guide](https://docs.docker.com/compose/install/)

## Procedure

### Launch with CPU

Clone this repository wherever you want, then go into `RaptGen-UI` directory.

```shell
$ git clone https://github.com/hmdlab/RaptGen-UI.git
$ cd RaptGen-UI
```

Build and run containers with following docker-compose.

```shell
$ docker compose up -d
```

!!! info

    If you add option `-d`, the application will run in the background. Otherwise, the application will run in the foreground and you can see the logs.

!!! info

    This command will build the containers from `compose.yml` on the root directory of the repository. If you change the `compose.yml` file, you need to run `docker compose build` to update the containers.

Please wait before all the containers are ready. This may take a few minutes. Even if Docker says they are ready, it may take some extra time for the `frontend` container to be working.

### Launch with CUDA

Clone this repository wherever you want, then go into `RaptGen-UI` directory.

```shell
$ git clone https://github.com/hmdlab/RaptGen-UI.git
$ cd RaptGen-UI
```

Build and run containers with following docker-compose.

```shell
$ docker compose -f compose.gpu.yml up -d
```

!!! info

    If you add option `-d`, the application will run in the background. Otherwise, the application will run in the foreground and you can see the logs.

Please wait before all the containers are ready. This may take a few minutes. Even if Docker says they are ready, it may take some extra time for the `frontend` container to be working.

### Access to the application server

Open your browser and access to [`http://localhost:18042`](http://localhost:18042).

If built on a remote server, you have to connect to the server with SSH and port-forwarding.

```shell
$ ssh -L 18042:localhost:18042 username@hostname.com
```

Then, access to [`http://localhost:18042`](http://localhost:18042).

### Stopping and Terminating

If you would like to stop the containers, please send `stop` command.
This stops containers and all data will be retained in `db` container.

```shell
$ docker compose stop
```

If you would like to terminate the containers, please send `down` command.
This terminates containers and all data will be deleted.

```shell
$ docker compose down
```
