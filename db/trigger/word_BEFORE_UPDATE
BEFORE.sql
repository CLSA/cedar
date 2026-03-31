CREATE TRIGGER word_BEFORE_UPDATE
BEFORE UPDATE ON cedar.word FOR EACH ROW
BEGIN
  IF NEW.misspelled = true AND NEW.misspelled <> OLD.misspelled THEN
    SET NEW.aft = "invalid";
    SET NEW.fas = "invalid";
  END IF;