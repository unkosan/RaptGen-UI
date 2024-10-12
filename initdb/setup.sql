CREATE TABLE viewer_vae (
    id SERIAL NOT NULL, 
    uuid VARCHAR NOT NULL, 
    create_timestamp VARCHAR, 
    name VARCHAR NOT NULL, 
    device VARCHAR, 
    seed INTEGER, 
    forward_adapter VARCHAR, 
    reverse_adapter VARCHAR, 
    random_region_length_standard INTEGER, 
    random_region_length_tolerance INTEGER, 
    minimum_count INTEGER, 
    epochs INTEGER, 
    epochs_beta_weighting INTEGER, 
    epochs_match_forcing INTEGER, 
    epochs_early_stopping INTEGER, 
    match_cost FLOAT, 
    phmm_length INTEGER, 
    checkpoint BYTEA NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (id), 
    UNIQUE (uuid)
);

CREATE TABLE viewer_gmm (
    id SERIAL NOT NULL, 
    uuid VARCHAR NOT NULL, 
    vae_uuid VARCHAR, 
    name VARCHAR NOT NULL, 
    seed INTEGER, 
    n_components INTEGER NOT NULL, 
    means FLOAT[][] NOT NULL, 
    covariances FLOAT[][][] NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (id), 
    UNIQUE (uuid), 
    FOREIGN KEY(vae_uuid) REFERENCES viewer_vae (uuid) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE viewer_sequence_data (
    id SERIAL NOT NULL, 
    vae_uuid VARCHAR, 
    random_region VARCHAR NOT NULL, 
    coord_x FLOAT NOT NULL, 
    coord_y FLOAT NOT NULL, 
    duplicate INTEGER NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (id), 
    FOREIGN KEY(vae_uuid) REFERENCES viewer_vae (uuid) ON DELETE CASCADE ON UPDATE CASCADE
);

COPY viewer_vae FROM '/docker-entrypoint-initdb.d/viewer_vae.csv' DELIMITER ',' CSV HEADER;
COPY viewer_gmm FROM '/docker-entrypoint-initdb.d/viewer_gmm.csv' DELIMITER ',' CSV HEADER;
COPY viewer_sequence_data FROM '/docker-entrypoint-initdb.d/viewer_sequence_data.csv' DELIMITER ',' CSV HEADER;

UPDATE viewer_vae SET checkpoint = pg_read_binary_file('/docker-entrypoint-initdb.d/RAPT1.pth') WHERE id = 0;
UPDATE viewer_vae SET checkpoint = pg_read_binary_file('/docker-entrypoint-initdb.d/RAPT3.pth') WHERE id = 1;