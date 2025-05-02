# VAE Trainer

This page allows you to train a VAE model using HT-SELEX data.

## Accessing the VAE Trainer Page

Navigate to the VAE Trainer by clicking the `VAE Trainer` link in the top menu or the navigation bar.

![Accessing the VAE Trainer page](../assets/images/vae-trainer/access.png)

## Training Process

### Initiating a New Training Job

Click the `+ Add a New Training Job` button located at the top left of the page.

![Location of the button for adding training job for VAE](../assets/images/vae-trainer/add-button.png)

### Setting the parameters

Set the preprocessing parameters for your training job, then click the `Next` button.

![Configuration page for preprocessing parameters](../assets/images/vae-trainer/preprocessing-parameters.png)

**Preprocessing Parameters**

1. **Model Type**: The type of the model. Choose `RaptGen`.
2. **Experiment Name**: Assign a name to your experiment.
3. **Target Length**: Specify the sequence length, including adapter length. The `Estimate` button activates after loading SELEX sequences (⑦).
4. **Adapters**: Set sequence adapters (constant region at 3' or 5' end). The `Estimate` button becomes available after setting the `Target Length` parameter (③).
5. **Filtering Tolernace**: Set the tolerance for sequence filtering, which is the allowable difference between the target length and the length of the sequence.
6. **Minimum Count**: Define the minimum sequence count. Sequences below this threshold will be filtered out.
7. **SELEX sequences**: Upload your training sequences in `.fasta` or `.fastq` format.

Next, set the training parameters and click the `Train` button.

![Configuration page for training parameters](../assets/images/vae-trainer/training-parameters.png)

**Training Parameters**

1. **Reiteration of Training**: Specify how many times to repeat training with the same dataset. (Not epoch, but the number of training)
2. **Device**: Select `CPU` or `cuda:X` for GPU (if available).
3. **Seed Value**: Set a seed for reproducibility. `Generate Random Seed` button in the right will generate a random seed.
4. **Maximum Number of Epochs**: Set the maximum training epochs.
5. **Early Stopping Patience**: Define how many epochs without improvement of the validation loss before stopping the training.
6. **Beta Weighting Epochs**: Specify epochs for increasing beta value from 0 to 1.
7. **Force Matching Epochs**: Specify epochs for force-matching. During the force-matching phase, the profile HMM model will be forced to have less penalty on match-to-match state transition score.
8. **Match Cost**: Define the intensity of the force-matching. The larger value will force the profile HMM model to have less penalty match-to-match state transition score.
9. **pHMM model length**: Set the profile HMM model length. Default is random region length.

### Training the model

After submission, the job appears in the Running Jobs list. You can monitor progress, stop, delete, or rename jobs from this list.

![Overview of detail page of job in progress](../assets/images/vae-trainer/main-page-in-training.png)

- To stop, delete or rename the job, you can click the `Stop`, `Delete`, or `Rename` button, respectively.
- The current status of the experiment section shows the job's progress and total number of jobs.
  ![current status of the experiment section](../assets/images/vae-trainer/current-info.png)
- The Training Parameters section displays the job's training parameters.  
  ![training parameters](../assets/images/vae-trainer/training-params-list.png)
- The Job information section provides details about the training job.  
  ![job information](../assets/images/vae-trainer/job-info.png)

### Adding the Trained Model to the Model List

Once training completes, add the model to the model list by clicking `Add to Viewer Dataset` button.

![Button to add training job to the dataset](../assets/images/vae-trainer/add-to-viewer-dataset-button.png)

Name your model in the pop-up modal and click the `Add to Viewer Dataset` button.

![Modal for adding job to the dataset](../assets/images/vae-trainer/add-to-viewer-dataset-modal.png)

The trained model will then be available in the Viewer, GMM Trainer and Bayes Optimization pages.

## Next Step

Proceed to the [GMM Trainer](gmm-trainer.md) page to train a GMM model.

If you have already trained a GMM model or have a initializing dataset in BO module, you can proceed to the [Bayesian Optimization](bayesian-optimization.md) page.
