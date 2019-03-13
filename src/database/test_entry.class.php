<?php
/**
 * test_entry.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @return boolean
   * @access public
   */
  public function is_completable()
  {
    $db_audio_status_type = $this->get_audio_status_type();
    $db_participant_status_type = $this->get_participant_status_type();
    return (
      is_null( $db_audio_status_type ) ||
      ( 'unusable' != $db_audio_status_type->name && 'unavailable' != $db_audio_status_type->name )
    ) && (
      is_null( $db_participant_status_type ) ||
      'refused' != $db_participant_status_type->name
    );
  }

  /**
   * Override parent method
   */
  public function save()
  {
    $new_record = is_null( $this->id );
    $rescore = $this->has_column_changed( 'state' ) && 'submitted' == $this->state;
    parent::save();
    if( $new_record ) $this->reset();
    else if( $rescore ) $this->rescore();
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

      if( !$allowed )
      {
        throw lib::create( 'exception\runtime',
          'Tried to change test-entry\'s state to submitted while data is not currently in a submittable state.',
          __METHOD__
        );
      }
    }

    parent::__set( $column_name, $value );
  }

  /**
   * Resets the test-entry by initializing the data associated with it (deleting any existing data)
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
   * Convenience method
   */
  public function get_audio_status_type()
  {
    return is_null( $this->audio_status_type_id ) ?
      NULL : lib::create( 'database\status_type', $this->audio_status_type_id );
  }

  /**
   * Convenience method
   */
  public function get_participant_status_type()
  {
    return is_null( $this->participant_status_type_id ) ?
      NULL : lib::create( 'database\status_type', $this->participant_status_type_id );
  }

  /**
   * Convenience method
   */
  public function get_admin_status_type()
  {
    return is_null( $this->admin_status_type_id ) ?
      NULL : lib::create( 'database\status_type', $this->admin_status_type_id );
  }

  /**
   * Get the test-entry's data table name
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
   * Opens the test-entry's activity
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
   * Closes the test-entry's activity
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
   * Re-calculates this test-entry's score
   * 
   * NOTE: to rescore all test-types use test_type::rescore_all()
   *       to rescore a single test-type only use test_type::rescore()
   *       to rescore the test-entries in a transcription use transcription::rescore()
   * @access public
   */
  public function rescore()
  {
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'test_entry.id', '=', $this->id );
    $this->get_test_type()->rescore( $modifier );
  }
}
