CREATE TABLE word_test_type_total (
  word_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  aft_total INT(10) UNSIGNED NOT NULL DEFAULT 0,
  fas_total INT(10) UNSIGNED NOT NULL DEFAULT 0,
  rey_total INT(10) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (word_id),
  INDEX dk_aft_total (aft_total ASC),
  INDEX dk_fas_total (fas_total ASC),
  INDEX dk_rey_total (rey_total ASC),
  CONSTRAINT fk_word_test_type_total_word_id
    FOREIGN KEY (word_id)
    REFERENCES word (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;
