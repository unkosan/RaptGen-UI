<div align="center">
   <img src="docs/assets/images/logo-full.png" alt="RaptGen-UI" width="400"><br>
   The GUI for RaptGen developed with React and FastAPI
</div>

## What is RaptGen-UI?

RaptGen-UI is a web-based user-friendly interface for RaptGen, a powerful Latent Space Bayesian Optimization (LSBO) method for identifying and optimizing aptamers from high-throughput SELEX data. For more information about RaptGen, please refer to the [RaptGen paper](https://doi.org/10.1038/s43588-022-00249-6).

## Overview

<p align="center">
   <img src="docs/assets/images/overview.png" alt="Overview of RaptGen-UI pipeline"><br>
</p>

Currently, RaptGen-UI supports four modules: 

* [Viewer](https://unkosan.github.io/RaptGen-UI/guides/viewer/): Explore the latent space of the trained VAE model.
* [VAE Trainer](https://unkosan.github.io/RaptGen-UI/guides/vae-trainer/): Train a VAE model to embed the SELEX data into a latent space.
* [GMM Trainer](https://unkosan.github.io/RaptGen-UI/guides/gmm-trainer/): Train a GMM model to cluster the latent space.
* [Bayesian Optimization](https://unkosan.github.io/RaptGen-UI/guides/bayesian-optimization/): Optimize aptamers by Bayesian Optimization.

Click on the links to learn more about each module.

## How to Launch

Git clone this repository.

```shell
$ git clone https://github.com/Unkosan/RaptGen-UI.git
$ cd RaptGen-UI
```

And just run the following command inside the directory!

```shell
$ docker compose up -d
```

After waiting for a while, you can access the RaptGen-UI by going to http://localhost:18042.

This application is deployed on Docker compose. 
If you want to run it on your local machine, you need to install Docker and Docker Compose.
For more information about installation, please refer to the [setup manual](https://unkosan.github.io/RaptGen-UI/setup/) on the documentation.

## Documentation

The detailed procedure can be found in the [documentation](https://unkosan.github.io/RaptGen-UI/).

## Contributing

Contributions are welcome!
If you find any bugs or have any suggestions, please feel free to open an issue or submit a pull request.

<!-- Just make sure to follow the [Code of Conduct](CODE_OF_CONDUCT.md). -->

## Citation

If you use RaptGen-UI in your research, please cite the following paper:

```bibtex
@article{nakano2025raptgenui,
   title={RaptGen-UI: Interactive Interface for RNA Aptamer Identification Using Latent Space Bayesian Optimization}
   author={Nakano, Ryota and Iwano, Natsuki and Ichinose, Akiko and Hamada, Michiaki}
   year={2025},
}
```

## License

This project is licensed under the [MIT License](LICENSE).
You are free to use, modify, and distribute this software for personal or commercial purposes.
