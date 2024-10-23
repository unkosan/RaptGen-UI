# GMM Trainer

In this page, you can train a GMM on the encoded HT-SELEX data.

## GMM Trainer View

![alt text](images/image-5.png)

## How to Train

### Adding a new training job

start by clicking the `+ Add a New Training Job` button.

![adding job](images/image-6.png)


### Setting the parameters

Set the preprocessing parameters for the training job. After setting the parameters, click the `Next` button.

![alt text](images/image-7.png)

**The parameters**

- ① Model Type: 
  - The type of the trained model. You can choose the model trained in the VAE Trainer.
- ② GMM name:
  - the name of the GMM model.
- ③ Minumum number of GMM components:
  - The minimum number of GMM components.
- ④ Maximum number of GMM components:
  - The maximum number of GMM components.
- ⑤ Step size of the search:
  - The step size of the search for the number of GMM components.
- ⑥ Number of trials on each number of components:
  - The number of iterations for the GMM training.

The GMM training is runned multiple times to select the best BIC model among the models trained with the different number of GMM components. The number of the training is determined by the following formula:

$$
\text{Number of trials} = \text{Number of trials on each number of components} \times (\text{Maximum number of components} - \text{Minimum number of components} + 1)
$$

The higher the number of the trials is, the more accurate the GMM model will be. However, the training time will be longer.

### Training the GMM model

Once the training is submitted, the training will be started. The training progress will be shown on the `Running` component.

![alt text](images/image-8.png)

### Add the model to the Model List

After the training is finished, you can check the job result. By default, the best model is selected based on the BIC score.


![alt text](images/image-9.png)

The plot shows the cluster of the GMM model and the embedded sequences.

Add the model to the model list by clicking the `Add to viewer dataset` button. 

### Next Steps

- [Bayesian Optimization](BO.md)
