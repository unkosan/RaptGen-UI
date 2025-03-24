# RaptGen-UI Documentation

## Welcome to RaptGen-UI

RaptGen-UI is a web-based user-friendly interface for RaptGen, a powerful Latent Space Bayesian Optimization (LSBO) method for identifying and optimizing aptamers from high-throughput SELEX data. For more information about RaptGen, please refer to the [RaptGen paper](https://doi.org/10.1038/s43588-022-00249-6).

## Overview of Pipeline

![Overview of RaptGen-UI pipeline](./assets/images/overview.png)

Currently, RaptGen-UI supports four modules: [Viewer](./guides/viewer.md), [VAE Trainer](./guides/vae-trainer.md), [GMM Trainer](./guides/gmm-trainer.md), and [Bayesian Optimization](./guides/bayesian-optimization.md). Click on the links to learn more about each module.

Users first need to upload their data and get the latent space of VAE model by running VAE Trainer module.
After that, users can explore on the latent space of the uploaded data by Viewer module, or run GMM Trainer module to get clustering results.
Finally, users can use Bayesian Optimization module to optimize aptamers.
