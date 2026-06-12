CREATE TRIGGER word_BEFORE_UPDATE BEFORE UPDATE ON word FOR EACH ROW
BEGIN

  IF NEW.misspelled = true AND NEW.misspelled <> OLD.misspelled THEN
    SET NEW.aft = "invalid";
    SET NEW.fas = "invalid";
  END IF;

  IF ( NEW.aft IN ( "intrusion", "primary" ) AND NEW.aft <> OLD.aft ) OR
     ( NEW.fas IN ( "intrusion", "primary" ) AND NEW.fas <> OLD.fas ) THEN
    SET NEW.misspelled = false;
  END IF;
END ;;
