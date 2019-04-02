SELECT "Creating new status_type table" AS "";

CREATE TABLE IF NOT EXISTS status_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  category ENUM('audio', 'participant', 'admin') NOT NULL,
  rank INT UNSIGNED NOT NULL,
  name VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_category_rank (category ASC, rank ASC),
  UNIQUE INDEX uq_category_name (category ASC, name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO status_type( category, rank, name ) VALUES
( 'participant', 1, 'Prompted' ),
( 'participant', 2, 'Prompt: Middle' ),
( 'participant', 3, 'Prompt: End' ),
( 'participant', 4, 'Prompt: Less than 5s' ),
( 'participant', 5, 'Prompt: More than 5s' ),
( 'participant', 6, 'Prompt: Less than 10s' ),
( 'participant', 7, 'Prompt: More than 10s' ),
( 'participant', 8, 'Prompt: Correction after 4D' ),
( 'participant', 9, 'Prompt: Suspected' ),
( 'participant', 10, 'Refused' ),
( 'audio', 1, 'Salvable' ),
( 'audio', 2, 'Salvable: Low volume' ),
( 'audio', 3, 'Salvable: Inaudible' ),
( 'audio', 4, 'Salvable: Cuts in and out' ),
( 'audio', 5, 'Salvable: Other' ),
( 'audio', 6, 'Unusable' ),
( 'audio', 7, 'Unavailable' ),
( 'audio', 8, 'CRF' ),
( 'admin', 1, 'Time provided' ),
( 'admin', 2, 'Correct number of words provided' ),
( 'admin', 3, 'Number of words on list provided' ),
( 'admin', 4, 'Not corrected before 4D' ),
( 'admin', 5, 'Cut off at beginning' ),
( 'admin', 6, 'Cut off at end' ),
( 'admin', 7, 'Other' );
