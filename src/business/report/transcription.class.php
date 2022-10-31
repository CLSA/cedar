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

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );

    $select = lib::create( 'database\select' );
    $select->from( 'transcription' );
    $select->add_column( 'participant.uid', 'UID', false );
    $this->add_application_identifier_columns( $select, $modifier );
    $select->add_column( 'cohort.name', 'Cohort', false );
    $select->add_column( 'language.name', 'Preferred Language', false );
    $select->add_column(
      'GROUP_CONCAT( DISTINCT transcription_language.name ORDER BY transcription_language.name )',
      'Transcription Language(s)',
      false
    );
    $select->add_column( 'site.name', 'Site', false );
    $select->add_column( 'GROUP_CONCAT( DISTINCT user.name ORDER BY user.name )', 'Users', false );

    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'transcription_has_language', 'transcription.id', 'transcription_has_language.transcription_id' );
    $modifier->join(
      'language',
      'transcription_has_language.language_id',
      'transcription_language.id',
      '',
      'transcription_language'
    );
    $modifier->join( 'site', 'transcription.site_id', 'site.id' );
    $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
    $modifier->join( 'test_entry_activity', 'test_entry.id', 'test_entry_activity.test_entry_id' );
    $modifier->join( 'user', 'test_entry_activity.user_id', 'user.id' );
    $modifier->group( 'transcription.id' );
    $modifier->order( 'participant.uid' );
      
    $this->add_table_from_select( NULL, $transcription_class_name::select( $select, $modifier ) );
  }
}
