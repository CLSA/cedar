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
    $aft_sel->add_column(
      'COUNT( DISTINCT IF( sub_word.id IS NOT NULL, sub_word.animal_code, word.animal_code ) )',
      'alt_score',
      false
    );

    $aft_mod = clone $modifier;
    $aft_mod->join( 'aft_data', 'test_entry.id', 'aft_data.test_entry_id' );
    $aft_mod->join( 'word', 'aft_data.word_id', 'word.id' );
    $aft_mod->where( 'test_type.data_type', '=', 'aft' );

    // join to the compond table to replace compound words with their sub-words instead
    $aft_mod->left_join( 'compound', 'word.id', 'compound.word_id' );
    $aft_mod->left_join( 'word', 'compound.sub_word_id', 'sub_word.id', 'sub_word' );
    $aft_mod->where( 'IF( sub_word.id IS NOT NULL, sub_word.aft, word.aft )', '=', 'primary' );
    $aft_mod->where( 'IF( sub_word.id IS NOT NULL, sub_word.animal_code, word.animal_code )', '!=', NULL );

    // the pre-aft modifier #1 is identical to the aft_mod, just without the group
    $pre_aft_mod1 = clone $aft_mod;

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
    $pre_aft_sel1->add_column(
      'SUBSTRING_INDEX( IF( sub_word.id IS NOT NULL, sub_word.animal_code, word.animal_code ), ".", 6 )',
      'animal_code',
      false
    );

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
      'IF( fas_data.word_id IS NULL, '.
          '0, '.
          'COUNT( '.
            'DISTINCT IFNULL( '.
              'IF( sub_word.id IS NOT NULL, sub_word.sister_word_id, word.sister_word_id ), '.
              'fas_data.word_id '.
            ') '.
          ') '.
      ')',
      'score',
      false
    );
    $fas_sel->add_constant( NULL, 'alt_score' );

    $fas_mod = clone $modifier;
    $fas_mod->left_join( 'fas_data', 'test_entry.id', 'fas_data.test_entry_id' );
    $fas_mod->left_join( 'word', 'fas_data.word_id', 'word.id' );
    $fas_mod->where( 'test_type.data_type', '=', 'fas' );

    // join to the compond table to replace compound words with their sub-words instead
    $fas_mod->left_join( 'compound', 'word.id', 'compound.word_id' );
    $fas_mod->left_join( 'word', 'compound.sub_word_id', 'sub_word.id', 'sub_word' );
    $fas_mod->where(
      'IFNULL( IF( sub_word.id IS NOT NULL, sub_word.fas, word.fas ), "primary" )',
      '=',
      'primary'
    );
    $fas_mod->where_bracket( true );
    $fas_mod->where( 'IF( sub_word.id IS NOT NULL, sub_word.id, word.id )', '=', NULL );
    $fas_mod->or_where(
      'SUBSTRING( IF( sub_word.id IS NOT NULL, sub_word.word, word.word ), 1, 1 )',
      '=',
      'LOWER( SUBSTRING( test_type.name, 1, 1 ) )',
      false
    );
    $fas_mod->where_bracket( false );
    $fas_mod->group( 'test_entry.id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $fas_sel->get_sql(),
      $fas_mod->get_sql()
    ) );

    // MAT /////////////////////////////////////////////////////////////////////////////////////////
    // first update the sequence ranks
    $base_sequence_sel = lib::create( 'database\select' );
    $base_sequence_sel->from( 'test_entry' );
    $base_sequence_sel->add_column(
      '( @sequence_rank := IF( @test_entry_id = test_entry_id, @sequence_rank + 1, 1 ) )',
      'srank',
      false
    );
    $base_sequence_sel->add_column(
      '( @test_entry_id := test_entry_id )',
      'test_entry_id',
      false
    );
    $base_sequence_sel->add_table_column( 'mat_data', 'rank' );
    $base_sequence_sel->add_table_column( 'mat_data', 'value' );

    $base_sequence_mod = clone $modifier;
    $base_sequence_mod->join( 'mat_data', 'test_entry.id', 'mat_data.test_entry_id' );
    $base_sequence_mod->order( 'test_entry_id' );
    $base_sequence_mod->order( 'rank' );

    $number_sequence_sel = clone $base_sequence_sel;
    $number_sequence_mod = clone $base_sequence_mod;
    $number_sequence_mod->where( 'value', 'RLIKE', '[0-9]' );
    static::db()->execute( 'SET @sequence_rank := 0' );
    static::db()->execute( 'SET @test_entry_id := 0' );
    static::db()->execute( sprintf(
      'INSERT INTO mat_data( sequence_rank, test_entry_id, rank, value ) %s %s'."\n".
      'ON DUPLICATE KEY UPDATE sequence_rank = VALUES( sequence_rank )',
      $number_sequence_sel->get_sql(),
      $number_sequence_mod->get_sql()
    ) );

    $letter_sequence_sel = clone $base_sequence_sel;
    $letter_sequence_mod = clone $base_sequence_mod;
    $letter_sequence_mod->where( 'value', 'RLIKE', '[a-z]' );
    static::db()->execute( 'SET @sequence_rank := 0' );
    static::db()->execute( 'SET @test_entry_id := 0' );
    static::db()->execute( sprintf(
      'INSERT INTO mat_data( sequence_rank, test_entry_id, rank, value ) %s %s'."\n".
      'ON DUPLICATE KEY UPDATE sequence_rank = VALUES( sequence_rank )',
      $letter_sequence_sel->get_sql(),
      $letter_sequence_mod->get_sql()
    ) );

    // now score the test using the sequence ranks
    $mat_sel = clone $select;
    $mat_sel->add_column( 'COUNT(*)', 'score', false );
    $mat_sel->add_constant( NULL, 'alt_score' );

    $mat_mod = clone $modifier;
    $mat_mod->join( 'mat_data', 'test_entry.id', 'mat_data.test_entry_id' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'mat_data.test_entry_id', '=', 'previous.test_entry_id', false );
    $join_mod->where( 'mat_data.rank', '=', 'previous.rank + 1', false );
    $mat_mod->join_modifier( 'mat_data', $join_mod, '', 'previous' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'mat_data.test_entry_id', '=', 'sequence.test_entry_id', false );
    $join_mod->where( 'mat_data.sequence_rank', '=', 'sequence.sequence_rank + 1', false );
    $join_mod->where( 'mat_data.value RLIKE "[0-9]"', '=', 'sequence.value RLIKE "[0-9]"', false );
    $mat_mod->join_modifier( 'mat_data', $join_mod, 'left', 'sequence' );
    $mat_mod->where( 'mat_data.value RLIKE "[0-9]"', '!=', 'previous.value RLIKE "[0-9]"', false );
    $mat_mod->where(
      'IFNULL( IF('."\n".
      '  mat_data.value RLIKE "[0-9]",'."\n".
      '  mat_data.value = sequence.value + 1,'."\n".
      '  ord( mat_data.value ) = ord( sequence.value ) + 1 '."\n".
      '), true )',
      '=',
      true
    );
    $mat_mod->group( 'mat_data.test_entry_id' );

    static::db()->execute( sprintf(
      "INSERT INTO temp_rescore\n%s %s",
      $mat_sel->get_sql(),
      $mat_mod->get_sql()
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
