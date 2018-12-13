<?php
/**
 * transcription.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\business\report;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Call history report
 */
class transcription extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $transcription_class_name = lib::get_class_name( 'database\transcription' );

    $select = lib::create( 'database\select' );
    $select->from( 'transcription' );
    $select->add_column( 'participant.uid', 'UID', false );
    $select->add_column( 'cohort.name', 'Cohort', false );
    $select->add_column( 'language.name', 'Language', false );
    $select->add_column( 'GROUP_CONCAT( DISTINCT user.name ORDER BY user.name )', 'Users', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );
    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
    $modifier->join( 'test_entry_activity', 'test_entry.id', 'test_entry_activity.test_entry_id' );
    $modifier->join( 'user', 'test_entry_activity.user_id', 'user.id' );
    $modifier->group( 'transcription.id' );
    $modifier->order( 'participant.uid' );
      
    $this->add_table_from_select( NULL, $transcription_class_name::select( $select, $modifier ) );
  }
}
