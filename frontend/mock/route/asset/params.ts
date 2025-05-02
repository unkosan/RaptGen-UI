export const vaeParams = {
  rapt1: {
    created_at: "2222/2/22",
    name: "RAPT1",
    device: "CPU",
    seed: 0,
    forward_adapter: "TAATACGACTCACTATAGGGAGCAGGAGAGAGGTCAGATG",
    reverse_adapter: "CCTATGCGTGCTAGTGTGA",
    random_region_length_standard: 30,
    random_region_length_tolerance: 0,
    minimum_count: 2,
    epochs: 1000,
    epochs_beta_weight: 50,
    epochs_match_forcing: 50,
    epochs_early_stopping: 50,
    match_cost: 5,
    phmm_length: 30,
  },
  rapt3: {
    created_at: "2222/2/22",
    name: "RAPT3",
    device: "CPU",
    seed: 0,
    forward_adapter: "TAATACGACTCACTATAGGGAGAACTTCGACCAGAAG",
    reverse_adapter: "TATGTGCGCATACATGGATCCTC",
    random_region_length_standard: 30,
    random_region_length_tolerance: 0,
    minimum_count: 2,
    epochs: 1000,
    epochs_beta_weight: 50,
    epochs_match_forcing: 50,
    epochs_early_stopping: 50,
    match_cost: 5,
    phmm_length: 30,
  },
};

export const gmmParams = {
  num_comp_15_A: {
    name: "num_comp_15_A",
    seed: 42,
    num_components: 15,
  },
  num_comp_15_B: {
    name: "num_comp_15_B",
    seed: 23,
    num_components: 15,
  },
};
