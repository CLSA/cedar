<?php
/**
 * test_type.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_type: record
 */
class test_type extends \cenozo\database\record
{
  /**
   * Re-calculates all test-entries of this test-type
   * 
   * NOTE: to rescore all test-types use test_type::rescore_all()
   *       to rescore a single test-entry use test_entry::rescore()
   *       to rescore the test-entries in a transcription use transcription::rescore()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Can be used to restrict which records to affect
   * @access public
   */
  public function rescore( $modifier = NULL )
  {
    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'test_type.id', '=', $this->id );
    static::rescore_all( $modifier );
  }

  /**
   * Re-calculates all test-entries
   * 
   * NOTE: to rescore a single test-type only use test_type::rescore()
   *       to rescore a single test-entry use test_entry::rescore()
   *       to rescore the test-entries in a transcription use transcription::rescore()
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Can be used to restrict which records to affect
   * @access public
   * @static
   */
  public static function rescore_all( $modifier = NULL )
  {
    static::db()->execute(
      'CREATE TEMPORARY TABLE temp_rescore ('."\n".
      '  id INT UNSIGNED NOT NULL,'."\n".
      '  score INT UNSIGNED DEFAULT NULL,'."\n".
      '  alt_score INT UNSIGNED DEFAULT NULL,'."\n".
      '  PRIMARY KEY ( id )'."\n".
      ')'
    );

    $select = lib::create( 'database\select' );
    $select->from( 'test_entry' );
    $select->add_column( 'id' );

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    $modifier->where( 'test_entry.state', '=', 'submitted' );
    $modifier->where( 'COALESCE( test_entry.audio_status, "" )', '!=', 'unusable' );
    $modifier->where( 'COALESCE( test_entry.audio_status, "" )', '!=', 'unavailable' );
    $modifier->where( 'COALESCE( test_entry.participant_status, "" )', '!=', 'refused' );

    // AFT /////////////////////////////////////////////////////////////////////////////////////////
    // alt-score is simply all unique animal codes
    $aft_sel = clone $select;
    $aft_sel->add_constant( NULL, 'score' );
    $aft_sel->add_column( 'COUNT( DISTINCT animal_code )', 'alt_score', false );

    $aft_mod = clone $modifier;
    $aft_mod->join( 'aft_data', 'test_entry.id', 'aft_data.test_entry_id' );
    $aft_mod->join( 'word', 'aft_data.word_id', 'word.id' );
    $aft_mod->where( 'test_type.data_type', '=', 'aft' );
    $aft_mod->where( 'word.aft', '=', 'primary' );
    $aft_mod->where( 'word.animal_code', '!=', NULL );
    $aft_mod->group( 'test_entry.id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s\n".
      "ON DUPLICATE KEY UPDATE\n".
        "alt_score = IFNULL( VALUES( alt_score ), 0 ) + alt_score",
      $aft_sel->get_sql(),
      $aft_mod->get_sql()
    ) );

    // standard score involves searching for wildcards (zeros)
    $pre_aft_sel1 = clone $select;
    $pre_aft_sel1->set_distinct( true );
    $pre_aft_sel1->add_column( 'SUBSTRING_INDEX( animal_code, ".", 6 )', 'animal_code', false );

    $pre_aft_mod1 = clone $modifier;
    $pre_aft_mod1->join( 'aft_data', 'test_entry.id', 'aft_data.test_entry_id' );
    $pre_aft_mod1->join( 'word', 'aft_data.word_id', 'word.id' );
    $pre_aft_mod1->where( 'test_type.data_type', '=', 'aft' );
    $pre_aft_mod1->where( 'word.aft', '=', 'primary' );
    $pre_aft_mod1->where( 'word.animal_code', '!=', NULL );

    static::db()->execute( sprintf(
      'CREATE TEMPORARY TABLE animal_code ('."\n".
      '  id INT UNSIGNED NOT NULL,'."\n".
      '  animal_code VARCHAR(45) NOT NULL,'."\n".
      '  INDEX dk_id( id ),'."\n".
      '  INDEX dk_animal_code( animal_code ),'."\n".
      '  UNIQUE INDEX uq_id_animal_code( id, animal_code )'."\n".
      ') %s %s',
      $pre_aft_sel1->get_sql(),
      $pre_aft_mod1->get_sql()
    ) );

    $pre_aft_sel2 = lib::create( 'database\select' );
    $pre_aft_sel2->from( 'animal_code' );
    $pre_aft_sel2->add_column( 'id' );
    $pre_aft_sel2->add_column( 'animal_code' );
    $pre_aft_sel2->add_column( 'REPLACE( animal_code, ".0", ".[^.]+" )', 'wildcard_code', false );

    $pre_aft_mod2 = lib::create( 'database\modifier' );
    $pre_aft_mod2->where( 'animal_code', 'RLIKE', '(\\.0\\.)|(\\.0$)' );
    static::db()->execute( sprintf(
      'CREATE TEMPORARY TABLE wildcard_code ('."\n".
      '  id INT UNSIGNED NOT NULL,'."\n".
      '  animal_code VARCHAR(45) NOT NULL,'."\n".
      '  wildcard_code VARCHAR(45) NOT NULL,'."\n".
      '  INDEX dk_id( id ),'."\n".
      '  INDEX dk_animal_code( animal_code ),'."\n".
      '  INDEX dk_wildcard_code( wildcard_code ),'."\n".
      '  UNIQUE INDEX uq_id_animal_code( id, animal_code ),'."\n".
      '  UNIQUE INDEX uq_id_wildcard_code( id, wildcard_code )'."\n".
      ') %s %s',
      $pre_aft_sel2->get_sql(),
      $pre_aft_mod2->get_sql()
    ) );

    // first count the codes without any wildcards (zeros)
    $aft_sel1 = lib::create( 'database\select' );
    $aft_sel1->from( 'animal_code' );
    $aft_sel1->add_column( 'id' );
    $aft_sel1->add_column( 'COUNT(*)', 'score', false );
    $aft_sel1->add_constant( NULL, 'alt_score' );
    $aft_mod1 = lib::create( 'database\modifier' );
    $aft_mod1->where( 'animal_code', 'NOT RLIKE', '(\\.0\\.)|(\\.0$)' );
    $aft_mod1->group( 'id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s\n".
      "ON DUPLICATE KEY UPDATE\n".
        "score = IFNULL( VALUES( score ), score ),\n".
        "alt_score = IFNULL( VALUES( alt_score ), alt_score )",
      $aft_sel1->get_sql(),
      $aft_mod1->get_sql()
    ) );

    // now add to the base score the number of unmatched woldcard codes
    $aft_sel2 = lib::create( 'database\select' );
    $aft_sel2->from( 'wildcard_code', 'w' );
    $aft_sel2->add_column( 'id' );
    $aft_sel2->add_column( 'COUNT(*)', 'score', false );
    $aft_sel2->add_constant( NULL, 'alt_score' );
    $aft_mod2 = lib::create( 'database\modifier' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'w.id', '=', 'a.id', false );
    $join_mod->where( 'a.animal_code', '!=', 'w.animal_code', false );
    $join_mod->where( 'a.animal_code', 'RLIKE', 'w.wildcard_code', false );
    $aft_mod2->join_modifier( 'animal_code', $join_mod, 'left', 'a' );
    $aft_mod2->where( 'a.id', '=', NULL );
    $aft_mod2->group( 'id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s\n".
      "ON DUPLICATE KEY UPDATE\n".
        "score = IFNULL( VALUES( score ), 0 ) + score,\n".
        "alt_score = IFNULL( VALUES( alt_score ), alt_score )",
      $aft_sel2->get_sql(),
      $aft_mod2->get_sql()
    ) );

    // FAS /////////////////////////////////////////////////////////////////////////////////////////
    // first convert homophones
    $homophone_mod = clone $modifier;
    $homophone_mod->join( 'fas_data', 'test_entry.id', 'fas_data.test_entry_id' );
    $homophone_mod->join( 'homophone', 'fas_data.word_id', 'homophone.word_id' );
    $homophone_mod->where( 'homophone.rank', '>', 1 );

    static::db()->execute( sprintf(
      "UPDATE test_entry %s\n".
      "SET fas_data.word_id = homophone.first_word_id\n".
      "WHERE %s",
      $homophone_mod->get_join(),
      $homophone_mod->get_where()
    ) );

    $fas_sel = clone $select;
    $fas_sel->add_column(
      'IF( word_id IS NULL, 0, COUNT( DISTINCT IFNULL( sister_word_id, word_id ) ) )',
      'score',
      false
    );
    $fas_sel->add_constant( NULL, 'alt_score' );

    $fas_mod = clone $modifier;
    $fas_mod->left_join( 'fas_data', 'test_entry.id', 'fas_data.test_entry_id' );
    $fas_mod->left_join( 'word', 'fas_data.word_id', 'word.id' );
    $fas_mod->where( 'test_type.data_type', '=', 'fas' );
    $fas_mod->where( 'IFNULL( word.fas, "primary" )', '=', 'primary' );
    $fas_mod->where_bracket( true );
    $fas_mod->where( 'word.id', '=', NULL );
    $fas_mod->or_where(
      'SUBSTRING( word.word, 1, 1 )', '=', 'LOWER( SUBSTRING( test_type.name, 1, 1 ) )', false );
    $fas_mod->where_bracket( false );
    $fas_mod->group( 'test_entry.id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $fas_sel->get_sql(),
      $fas_mod->get_sql()
    ) );

    // MAT /////////////////////////////////////////////////////////////////////////////////////////
    $mat_sel = clone $select;
    $mat_sel->add_column(
      'IF( value != "1", NULL, 0 )',
      'score',
      false
    );
    $mat_sel->add_constant( NULL, 'alt_score' );

    $mat_mod1 = clone $modifier;
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'test_entry.id', '=', 'mat_data.test_entry_id', false );
    $join_mod->where( 'mat_data.rank', '=', 1 );
    $mat_mod1->join_modifier( 'mat_data', $join_mod, 'left' );
    $mat_mod1->where( 'test_type.data_type', '=', 'mat' );
    $mat_mod1->group( 'test_entry.id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $mat_sel->get_sql(),
      $mat_mod1->get_sql()
    ) );

    $mat_mod2 = lib::create( 'database\modifier' );
    $mat_mod2->join( 'test_entry', 'temp_rescore.id', 'test_entry.id' );
    $mat_mod2->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    $mat_mod2->where( 'test_type.data_type', '=', 'mat' );
    $mat_mod2->where( 'temp_rescore.score', '!=', NULL );

    $mat_sub_sel = lib::create( 'database\select' );
    $mat_sub_sel->from( 'mat_data' );
    $mat_sub_sel->add_column( 'COUNT(*)', 'total', false );
    $mat_sub_mod = lib::create( 'database\modifier' );
    $mat_sub_mod->where( 'test_entry_id', '=', 'temp_rescore.id', false );
    $mat_sub_mod->where_bracket( true );
    $alpha = 'a';
    $number = 2;
    for( $rank = 2; $rank <= 52; $rank++ )
    {
      $mat_sub_mod->where_bracket( true, true );
      $mat_sub_mod->where( 'rank', '=', $rank );
      if( 0 == $rank % 2 )
      {
        $mat_sub_mod->where( 'value', '=', $alpha );
        $alpha++;
      }
      else
      {
        $mat_sub_mod->where( 'value', '=', $number );
        $number++;
      }
      $mat_sub_mod->where_bracket( false );
    }
    $mat_sub_mod->where_bracket( false );

    static::db()->execute( sprintf(
      'UPDATE temp_rescore %s'."\n".
      'SET temp_rescore.score = ('."\n".
      '%s %s'.
      ')'."\n".
      'WHERE %s',
      $mat_mod2->get_join(),
      $mat_sub_sel->get_sql(),
      $mat_sub_mod->get_sql(),
      $mat_mod2->get_where()
    ) );

    // REY1 ////////////////////////////////////////////////////////////////////////////////////////
    // first convert homophones
    $homophone_mod = clone $modifier;
    $homophone_mod->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
    $homophone_mod->join( 'rey_data_has_word', 'rey_data.id', 'rey_data_has_word.rey_data_id' );
    $homophone_mod->join( 'homophone', 'rey_data_has_word.word_id', 'homophone.word_id' );
    $homophone_mod->where( 'homophone.rank', '>', 1 );
    $homophone_mod->where( 'test_type.name', 'LIKE', '%(REY1)' );

    static::db()->execute( sprintf(
      "UPDATE test_entry %s\n".
      "SET rey_data_has_word.word_id = homophone.first_word_id\n".
      "WHERE %s",
      $homophone_mod->get_join(),
      $homophone_mod->get_where()
    ) );

    $rey1_sel = clone $select;
    $rey1_sel->add_column(
      'IF( drum OR drum_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( curtain OR curtain_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( bell OR bell_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( coffee OR coffee_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( school OR school_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( parent OR parent_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( moon OR moon_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( garden OR garden_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( hat OR hat_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( farmer OR farmer_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( nose OR nose_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( turkey OR turkey_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( colour OR colour_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( house OR house_rey_data_variant_id IS NOT NULL, 1, 0 ) +'."\n".
      'IF( river OR river_rey_data_variant_id IS NOT NULL, 1, 0 )',
      'score',
      false
    );
    $rey1_sel->add_constant( NULL, 'alt_score' );

    $rey1_mod = clone $modifier;
    $rey1_mod->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
    $rey1_mod->where( 'test_type.name', 'LIKE', '%(REY1)' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $rey1_sel->get_sql(),
      $rey1_mod->get_sql()
    ) );

    // REY2 ////////////////////////////////////////////////////////////////////////////////////////
    // first convert homophones
    $homophone_mod = clone $modifier;
    $homophone_mod->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
    $homophone_mod->join( 'rey_data_has_word', 'rey_data.id', 'rey_data_has_word.rey_data_id' );
    $homophone_mod->join( 'homophone', 'rey_data_has_word.word_id', 'homophone.word_id' );
    $homophone_mod->where( 'homophone.rank', '>', 1 );
    $homophone_mod->where( 'test_type.name', 'LIKE', '%(REY2)' );

    static::db()->execute( sprintf(
      "UPDATE test_entry %s\n".
      "SET rey_data_has_word.word_id = homophone.first_word_id\n".
      "WHERE %s",
      $homophone_mod->get_join(),
      $homophone_mod->get_where()
    ) );

    $rey2_sel = clone $select;
    $rey2_sel->add_column(
      'IF( ( rey_data.drum AND first_rey_data.drum_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.drum_rey_data_variant_id = first_rey_data.drum_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.curtain AND first_rey_data.curtain_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.curtain_rey_data_variant_id = first_rey_data.curtain_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.bell AND first_rey_data.bell_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.bell_rey_data_variant_id = first_rey_data.bell_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.coffee AND first_rey_data.coffee_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.coffee_rey_data_variant_id = first_rey_data.coffee_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.school AND first_rey_data.school_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.school_rey_data_variant_id = first_rey_data.school_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.parent AND first_rey_data.parent_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.parent_rey_data_variant_id = first_rey_data.parent_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.moon AND first_rey_data.moon_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.moon_rey_data_variant_id = first_rey_data.moon_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.garden AND first_rey_data.garden_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.garden_rey_data_variant_id = first_rey_data.garden_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.hat AND first_rey_data.hat_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.hat_rey_data_variant_id = first_rey_data.hat_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.farmer AND first_rey_data.farmer_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.farmer_rey_data_variant_id = first_rey_data.farmer_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.nose AND first_rey_data.nose_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.nose_rey_data_variant_id = first_rey_data.nose_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.turkey AND first_rey_data.turkey_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.turkey_rey_data_variant_id = first_rey_data.turkey_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.colour AND first_rey_data.colour_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.colour_rey_data_variant_id = first_rey_data.colour_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.house AND first_rey_data.house_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.house_rey_data_variant_id = first_rey_data.house_rey_data_variant_id ), 1, 0 ) +'."\n".
      'IF( ( rey_data.river AND first_rey_data.river_rey_data_variant_id IS NULL ) OR'."\n".
      '    ( rey_data.river_rey_data_variant_id = first_rey_data.river_rey_data_variant_id ), 1, 0 )',
      'score',
      false
    );
    $rey2_sel->add_constant( NULL, 'alt_score' );

    $rey2_mod = clone $modifier;
    $rey2_mod->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
    $rey2_mod->join(
      'test_entry', 'first_test_entry.transcription_id', 'test_entry.transcription_id', '', 'first_test_entry' );
    $rey2_mod->join( 'test_type', 'first_test_entry.test_type_id', 'first_test_type.id', '', 'first_test_type' );
    $rey2_mod->join( 'rey_data', 'first_test_entry.id', 'first_rey_data.test_entry_id', '', 'first_rey_data' );
    $rey2_mod->where( 'test_type.name', 'LIKE', '%(REY2)' );
    $rey2_mod->where( 'first_test_type.name', 'LIKE', '%(REY1)' );
    $rey2_mod->where( 'COALESCE( first_test_entry.participant_status, "" )', 'NOT LIKE', 'prompt%' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $rey2_sel->get_sql(),
      $rey2_mod->get_sql()
    ) );

    // now update the test-entry scores
    static::db()->execute(
      'UPDATE test_entry'."\n".
      'JOIN temp_rescore USING( id )'."\n".
      'SET test_entry.score = temp_rescore.score,'."\n".
      '    test_entry.alt_score = temp_rescore.alt_score'
    );
    static::db()->execute( 'DROP TABLE temp_rescore' );
  }
}
