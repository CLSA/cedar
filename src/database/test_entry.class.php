<?php
/**
 * test_entry.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry: record
 */
class test_entry extends \cenozo\database\record
{
  /**
   * Determines whether the test-entry has a status that prevents it from being fully entered
   * 
   * This is done based on the audio and participant status columns
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_completable()
  {
    return (
      is_null( $this->audio_status ) ||
      ( 'unusable' != $this->audio_status && 'unavailable' != $this->audio_status )
    ) && (
      is_null( $this->participant_status ) ||
      'refused' != $this->participant_status
    );
  }

  /**
   * Override parent method
   */
  public function save()
  {
    $new_record = is_null( $this->id );
    parent::save();
    if( $new_record ) $this->reset();
  }

  /**
   * Override parent method
   */
  public function __set( $column_name, $value )
  {
    // check that the test entry's data is valid before submitting
    if( 'state' == $column_name && 'submitted' == $value )
    {
      $allowed = true;
      $data_type = $this->get_test_type()->data_type;

      if( $this->is_completable() )
      {
        if( 'aft' == $data_type )
        {
          // make sure there are no placeholders or invalid words
          $modifier = lib::create( 'database\modifier' );
          $modifier->left_join( 'word', 'aft_data.word_id', 'word.id' );
          $modifier->where( 'aft_data.word_id', '=', NULL );
          $modifier->or_where( 'word.aft', '=', 'invalid' );
          if( 0 < $this->get_aft_data_count( $modifier ) ) $allowed = false;
        }
        else if( 'fas' == $data_type )
        {
          // make sure there are no placeholders or invalid words
          $modifier = lib::create( 'database\modifier' );
          $modifier->left_join( 'word', 'fas_data.word_id', 'word.id' );
          $modifier->where( 'fas_data.word_id', '=', NULL );
          $modifier->or_where( 'word.fas', '=', 'invalid' );
          if( 0 < $this->get_fas_data_count( $modifier ) ) $allowed = false;
        }
        else if( 'premat' == $data_type )
        {
          $premat_data_class_name = lib::get_class_name( 'database\premat_data' );
          $db_premat_data = $premat_data_class_name::get_unique_record( 'test_entry_id', $this->id );
          if( is_null( $db_premat_data->counting ) || is_null( $db_premat_data->alphabet ) ) $allowed = false;
        }
        else if( 'rey' == $data_type )
        {
          // make sure there is no missing data
          $rey_data_class_name = lib::get_class_name( 'database\rey_data' );
          $db_rey_data = $rey_data_class_name::get_unique_record( 'test_entry_id', $this->id );
          if( ( is_null( $db_rey_data->drum ) && is_null( $db_rey_data->drum_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->curtain ) && is_null( $db_rey_data->curtain_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->bell ) && is_null( $db_rey_data->bell_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->coffee ) && is_null( $db_rey_data->coffee_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->school ) && is_null( $db_rey_data->school_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->parent ) && is_null( $db_rey_data->parent_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->moon ) && is_null( $db_rey_data->moon_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->garden ) && is_null( $db_rey_data->garden_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->hat ) && is_null( $db_rey_data->hat_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->farmer ) && is_null( $db_rey_data->farmer_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->nose ) && is_null( $db_rey_data->nose_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->turkey ) && is_null( $db_rey_data->turkey_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->colour ) && is_null( $db_rey_data->colour_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->house ) && is_null( $db_rey_data->house_rey_data_variant_id ) ) ||
              ( is_null( $db_rey_data->river ) && is_null( $db_rey_data->river_rey_data_variant_id ) ) ) {
            $allowed = false;
          } else {
            // make sure there are no placeholders or invalid words
            $modifier = lib::create( 'database\modifier' );
            $modifier->join( 'rey_data_has_word', 'rey_data.id', 'rey_data_has_word.rey_data_id' );
            $modifier->join( 'word', 'rey_data_has_word.word_id', 'word.id' );
            $modifier->where( 'IFNULL( word.misspelled, false )', '=', true );
            if( 0 < $this->get_rey_data_count( $modifier ) ) $allowed = false;
          }
        }
      }

      if( $allowed )
      {
        parent::__set( $column_name, $value );
        $this->calculate_score();
      }
      else
      {
        throw lib::create( 'exception\runtime',
          'Tried to change test-entry\'s state to submitted while data is not currently in a submittable state.',
          __METHOD__
        );
      }
    }
    else parent::__set( $column_name, $value );
  }

  /**
   * Resets the test-entry by initializing the data associated with it (deleting any existing data)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function reset()
  {
    // initialize the test entry's data
    $data_class_name = lib::get_class_name( sprintf( 'database\%s', $this->get_data_table_name() ) );
    $data_class_name::initialize( $this );
  }

  /**
   * Override parent method
   */
  public static function get_unique_record( $column, $value )
  {
    $test_type_class_name = lib::get_class_name( 'database\test_type' );

    // convert uid column to a transcription_id
    if( is_array( $column ) && in_array( 'uid', $column ) )
    {
      $index = array_search( 'uid', $column );
      if( false !== $index )
      {
        $transcription_class_name = lib::get_class_name( 'database\transcription' );
        $db_transcription = $transcription_class_name::get_unique_record( 'uid', $value[$index] );
        $column[$index] = 'transcription_id';
        $value[$index] = is_null( $db_transcription ) ? 0 : $db_transcription->id;
      }
    }

    // add (uid,test_type_rank) as artificial unique record type
    if( is_array( $column ) && in_array( 'test_type_rank', $column ) )
    {
      $index = array_search( 'test_type_rank', $column );
      if( false !== $index ) {
        $db_test_type = $test_type_class_name::get_unique_record( 'rank', $value[$index] );
        if( !is_null( $db_test_type ) )
        {
          $column[$index] = 'test_type_id';
          $value[$index] = $db_test_type->id;
        }
      }
    }

    return parent::get_unique_record( $column, $value );
  }

  /**
   * TODO: document
   */
  public function get_data_table_name()
  {
    $db_test_type = $this->get_test_type();

    if( is_null( $db_test_type ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to get data table-name of test entry that has no test type set.',
        __METHOD__
      );
    }

    return $db_test_type->data_type.'_data';
  }

  /**
   * TODO: document
   */
  public function open_activity()
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // only open activity for typists
    if( 'typist' == $db_role->name && 'assigned' == $this->state )
    {
      // check to see if the activity record already exists
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'user_id', '=', $db_user->id );
      $modifier->where( 'end_datetime', '=', NULL );
      if( 0 == $this->get_test_entry_activity_count( $modifier ) )
      {
        $db_test_entry_activity = lib::create( 'database\test_entry_activity' );
        $db_test_entry_activity->test_entry_id = $this->id;
        $db_test_entry_activity->user_id = $db_user->id;
        $db_test_entry_activity->start_datetime = util::get_datetime_object();
        $db_test_entry_activity->save();
      }
    }
  }

  /**
   * TODO: document
   */
  public function close_activity()
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // only close activity for typists
    if( 'typist' == $db_role->name )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'test_entry_id', '=', $this->id );
      $modifier->where( 'user_id', '=', $db_user->id );
      $modifier->where( 'end_datetime', '=', NULL );

      static::db()->execute( sprintf(
        'UPDATE test_entry_activity'."\n".
        'SET end_datetime = UTC_TIMESTAMP() %s',
        $modifier->get_sql()
      ) );
    }
  }

  /**
   * Re-calculates the test-entry's score, storing the value in the score column
   * 
   * Note, if the test-entry is not submitted the score will always be NULL.
   * This method sets the score and alt_score columns but does not save the record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function calculate_score()
  {
    $score = NULL;
    $alt_score = NULL;
    if( 'submitted' == $this->state && $this->is_completable() )
    {
      $score = 0;

      $select = lib::create( 'database\select' );
      $select->from( 'test_entry' );

      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'test_entry.id', '=', $this->id );

      $db_test_type = $this->get_test_type();
      if( 'fas' == $db_test_type->data_type )
      {
        $select->add_column(
          'IF( word_id IS NULL, 0, COUNT( DISTINCT IFNULL( sister_word_id, word_id ) ) )',
          'score',
          false
        );

        $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
        $modifier->left_join( 'fas_data', 'test_entry.id', 'fas_data.test_entry_id' );
        $modifier->left_join( 'word', 'fas_data.word_id', 'word.id' );
        $modifier->where( 'IFNULL( word.fas, "primary" )', '=', 'primary' );
        $modifier->where_bracket( true );
        $modifier->where( 'word.id', '=', NULL );
        $modifier->or_where(
          'SUBSTRING( word.word, 1, 1 )', '=', 'LOWER( SUBSTRING( test_type.name, 1, 1 ) )', false );
        $modifier->where_bracket( false );

        $row = current( $this->select( $select, $modifier ) );
        $score = $row['score'];
      }
      else if( 'rey' == $db_test_type->data_type )
      {
        if( false != strpos( $db_test_type->name, '(REY1)' ) )
        {
          $select->add_column(
            'IF( drum OR drum_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( curtain OR curtain_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( bell OR bell_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( coffee OR coffee_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( school OR school_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( parent OR parent_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( moon OR moon_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( garden OR garden_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( hat OR hat_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( farmer OR farmer_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( nose OR nose_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( turkey OR turkey_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( colour OR colour_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( house OR house_rey_data_variant_id IS NOT NULL, 1, 0 ) + '.
            'IF( river OR river_rey_data_variant_id IS NOT NULL, 1, 0 )',
            'score',
            false
          );

          $modifier->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
        }
        else // REY2
        {
          $select->add_column(
            'IF( ( rey_data.drum AND first_rey_data.drum_rey_data_variant_id IS NULL ) OR  '.
                '( rey_data.drum_rey_data_variant_id = first_rey_data.drum_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.curtain AND first_rey_data.curtain_rey_data_variant_id IS NULL ) OR  '.
                '( rey_data.curtain_rey_data_variant_id = first_rey_data.curtain_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.bell AND first_rey_data.bell_rey_data_variant_id IS NULL ) OR  '.
                '( rey_data.bell_rey_data_variant_id = first_rey_data.bell_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.coffee AND first_rey_data.coffee_rey_data_variant_id IS NULL ) OR  '.
                '( rey_data.coffee_rey_data_variant_id = first_rey_data.coffee_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.school AND first_rey_data.school_rey_data_variant_id IS NULL ) OR  '.
                '( rey_data.school_rey_data_variant_id = first_rey_data.school_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.parent AND first_rey_data.parent_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.parent_rey_data_variant_id = first_rey_data.parent_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.moon AND first_rey_data.moon_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.moon_rey_data_variant_id = first_rey_data.moon_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.garden AND first_rey_data.garden_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.garden_rey_data_variant_id = first_rey_data.garden_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.hat AND first_rey_data.hat_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.hat_rey_data_variant_id = first_rey_data.hat_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.farmer AND first_rey_data.farmer_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.farmer_rey_data_variant_id = first_rey_data.farmer_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.nose AND first_rey_data.nose_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.nose_rey_data_variant_id = first_rey_data.nose_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.turkey AND first_rey_data.turkey_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.turkey_rey_data_variant_id = first_rey_data.turkey_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.colour AND first_rey_data.colour_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.colour_rey_data_variant_id = first_rey_data.colour_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.house AND first_rey_data.house_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.house_rey_data_variant_id = first_rey_data.house_rey_data_variant_id ), 1, 0 ) + '.
            'IF( ( rey_data.river AND first_rey_data.river_rey_data_variant_id IS NULL ) OR '.
                '( rey_data.river_rey_data_variant_id = first_rey_data.river_rey_data_variant_id ), 1, 0 )',
            'score',
            false
          );

          $modifier->join( 'rey_data', 'test_entry.id', 'rey_data.test_entry_id' );
          $modifier->join(
            'test_entry',
            'first_test_entry.transcription_id',
            'test_entry.transcription_id',
            '',
            'first_test_entry'
          );
          $modifier->join(
            'test_type',
            'first_test_entry.test_type_id',
            'first_test_type.id',
            '',
            'first_test_type'
          );
          $modifier->join(
            'rey_data',
            'first_test_entry.id',
            'first_rey_data.test_entry_id',
            '',
            'first_rey_data'
          );
          $modifier->where( 'first_test_type.name', 'LIKE', '%(REY1)' );
        }

        $row = current( $this->select( $select, $modifier ) );
        $score = $row['score'];
      }
      else if( 'aft' == $db_test_type->data_type )
      {
        // TODO: re-write
      }
      else if( 'premat' == $db_test_type->data_type )
      {
        // the pre-MAT test isn't scored
      }
      else if( 'mat' == $db_test_type->data_type )
      {
        $select->add_table_column( 'mat_data', 'rank' );
        $select->add_table_column( 'mat_data', 'value' );

        $modifier->join( 'mat_data', 'test_entry.id', 'mat_data.test_entry_id' );
        $modifier->order( 'mat_data.rank' );

        foreach( $this->select( $select, $modifier ) as $row )
        {
          if( 1 == $row['rank'] && '1' != $row['value'] )
          {
            $score = NULL;
            break;
          }

          if( ( $row['rank'] == 2 && $row['value'] == 'a' ) || ( $row['rank'] == 3 && $row['value'] == '2' ) ||
              ( $row['rank'] == 4 && $row['value'] == 'b' ) || ( $row['rank'] == 5 && $row['value'] == '3' ) ||
              ( $row['rank'] == 6 && $row['value'] == 'c' ) || ( $row['rank'] == 7 && $row['value'] == '4' ) ||
              ( $row['rank'] == 8 && $row['value'] == 'd' ) || ( $row['rank'] == 9 && $row['value'] == '5' ) ||
              ( $row['rank'] == 10 && $row['value'] == 'e' ) || ( $row['rank'] == 11 && $row['value'] == '6' ) ||
              ( $row['rank'] == 12 && $row['value'] == 'f' ) || ( $row['rank'] == 13 && $row['value'] == '7' ) ||
              ( $row['rank'] == 14 && $row['value'] == 'g' ) || ( $row['rank'] == 15 && $row['value'] == '8' ) ||
              ( $row['rank'] == 16 && $row['value'] == 'h' ) || ( $row['rank'] == 17 && $row['value'] == '9' ) ||
              ( $row['rank'] == 18 && $row['value'] == 'i' ) || ( $row['rank'] == 19 && $row['value'] == '10' ) ||
              ( $row['rank'] == 20 && $row['value'] == 'j' ) || ( $row['rank'] == 21 && $row['value'] == '11' ) ||
              ( $row['rank'] == 22 && $row['value'] == 'k' ) || ( $row['rank'] == 23 && $row['value'] == '12' ) ||
              ( $row['rank'] == 24 && $row['value'] == 'l' ) || ( $row['rank'] == 25 && $row['value'] == '13' ) ||
              ( $row['rank'] == 26 && $row['value'] == 'm' ) || ( $row['rank'] == 27 && $row['value'] == '14' ) ||
              ( $row['rank'] == 28 && $row['value'] == 'n' ) || ( $row['rank'] == 29 && $row['value'] == '15' ) ||
              ( $row['rank'] == 30 && $row['value'] == 'o' ) || ( $row['rank'] == 31 && $row['value'] == '16' ) ||
              ( $row['rank'] == 32 && $row['value'] == 'p' ) || ( $row['rank'] == 33 && $row['value'] == '17' ) ||
              ( $row['rank'] == 34 && $row['value'] == 'q' ) || ( $row['rank'] == 35 && $row['value'] == '18' ) ||
              ( $row['rank'] == 36 && $row['value'] == 'r' ) || ( $row['rank'] == 37 && $row['value'] == '19' ) ||
              ( $row['rank'] == 38 && $row['value'] == 's' ) || ( $row['rank'] == 39 && $row['value'] == '20' ) ||
              ( $row['rank'] == 40 && $row['value'] == 't' ) || ( $row['rank'] == 41 && $row['value'] == '21' ) ||
              ( $row['rank'] == 42 && $row['value'] == 'u' ) || ( $row['rank'] == 43 && $row['value'] == '22' ) ||
              ( $row['rank'] == 44 && $row['value'] == 'v' ) || ( $row['rank'] == 45 && $row['value'] == '23' ) ||
              ( $row['rank'] == 46 && $row['value'] == 'w' ) || ( $row['rank'] == 47 && $row['value'] == '24' ) ||
              ( $row['rank'] == 48 && $row['value'] == 'x' ) || ( $row['rank'] == 49 && $row['value'] == '25' ) ||
              ( $row['rank'] == 50 && $row['value'] == 'y' ) || ( $row['rank'] == 51 && $row['value'] == '26' ) ||
              ( $row['rank'] == 52 && $row['value'] == 'z' ) ) $score++;
        }
      }
    }

    $this->score = $score;
    $this->alt_score = $alt_score;
  }
}
