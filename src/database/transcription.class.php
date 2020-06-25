<?php
/**
 * transcription.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * transcription: record
 */
class transcription extends \cenozo\database\record
{
  /**
   * Extends parent method
   */
  public function save()
  {
    $test_type_class_name = lib::get_class_name( 'database\test_type' );
    $new_record = is_null( $this->id );
    $test_type_list = NULL;

    if( $new_record )
    {
      // get a list of test-entry types and set the assigned_count
      $test_type_sel = lib::create( 'database\select' );
      $test_type_sel->add_column( 'id' );
      $test_type_mod = lib::create( 'database\modifier' );
      $test_type_mod->join( 'test_type_has_cohort', 'test_type.id', 'test_type_has_cohort.test_type_id' );
      $test_type_mod->join( 'participant', 'test_type_has_cohort.cohort_id', 'participant.cohort_id' );
      $test_type_mod->where( 'participant.id', '=', $this->participant_id );
      $test_type_mod->order( 'rank' );
      $test_type_list = $test_type_class_name::select( $test_type_sel, $test_type_mod );
      $this->assigned_count = count( $test_type_list );
    }
    else // saving an existing record
    {
      // make sure the user isn't being set if the transcription is complete
      if( $this->has_column_changed( 'user_id' ) &&
          !is_null( $this->user_id ) &&
          0 == $this->assigned_count &&
          0 == $this->deferred_count )
      {
        throw lib::create( 'exception\runtime',
          'Cannot set user_id for transcription since all test_entries have been submitted.',
          __METHOD__
        );
      }
    }

    parent::save();

    // create test entries if this is a new transcription
    if( $new_record )
    {
      // create a test-entry and test-data for each test-type
      foreach( $test_type_list as $test_type )
      {
        $db_test_entry = lib::create( 'database\test_entry' );
        $db_test_entry->transcription_id = $this->id;
        $db_test_entry->test_type_id = $test_type['id'];
        $db_test_entry->save(); // this will create the test data for this entry

        // add the participant's preferred language to the test entry
        $db_test_entry->add_language( $this->get_participant()->language_id );
      }
    }
  }

  /**
   * Extend parent method
   */
  public static function get_unique_record( $column, $value )
  {
    $record = NULL;

    // convert uid column to participant_id
    if( 'uid' == $column || ( is_array( $column ) && in_array( 'uid', $column ) ) )
    {
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $db_participant = $participant_class_name::get_unique_record( $column, $value );
      if( 'uid' == $column )
      {
        $column = 'participant_id';
        $value = is_null( $db_participant ) ? 0 : $db_participant->id;
      }
      else
      {
        $index = array_search( 'uid', $column );
        if( false !== $index )
        {
          $column[$index] = 'participant_id';
          $value[$index] = is_null( $db_participant ) ? 0 : $db_participant->id;
        }
      }
    }

    return parent::get_unique_record( $column, $value );
  }

  /**
   * Re-calculates this transcription's test-entry scores
   * 
   * NOTE: to rescore all test-types use test_type::rescore_all()
   *       to rescore a single test-type only use test_type::rescore()
   *       to rescore a single test-entry use test_entry::rescore()
   * @access public
   */
  public function rescore()
  {
    $test_type_class_name = lib::get_class_name( 'database\test_type' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'test_entry.transcription_id', '=', $this->id );

    $test_type_class_name::rescore_all( $modifier );
  }
}
