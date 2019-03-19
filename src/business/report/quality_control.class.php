<?php
/**
 * quality_control.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\business\report;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Quality control report
 */
class quality_control extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $phone_call_class_name = lib::get_class_name( 'database\phone_call' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join(
      'transcription_has_language', 'transcription.id', 'transcription_has_language.transcription_id' );
    $modifier->join( 'language', 'transcription_has_language.language_id', 'language.id' );
    $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );
    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
    $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    $modifier->join( 'test_entry_note', 'test_entry.id', 'test_entry_note.test_entry_id' );
    $modifier->join( 'user', 'test_entry_note.user_id', 'user.id' );
    $modifier->left_join(
      'status_type',
      'test_entry.audio_status_type_id',
      'audio_status_type.id',
      'audio_status_type'
    );
    $modifier->left_join(
      'status_type',
      'test_entry.participant_status_type_id',
      'participant_status_type.id',
      'participant_status_type'
    );
    $modifier->left_join(
      'status_type',
      'test_entry.admin_status_type_id',
      'admin_status_type.id',
      'admin_status_type'
    );
    $modifier->where_bracket( true );
    $modifier->where( 'audio_status_type.name', 'LIKE', 'Salvable%' );
    $modifier->or_where( 'audio_status_type.name', '=', 'Unusable' );
    $modifier->or_where( 'participant_status_type.name', 'LIKE', 'Prompt%' );
    $modifier->or_where( 'admin_status_type.name', '!=', NULL );
    $modifier->where_bracket( false );
    $modifier->group( 'transcription.id' );
    $modifier->order( 'transcription.start_datetime' );

    foreach( $this->get_restriction_list() as $restriction )
    {
      if( 'collection' == $restriction['name'] )
      {
        $modifier->join(
          'collection_has_participant', 'participant.id', 'collection_has_participant.participant_id' );
        $modifier->where( 'collection_has_participant.collection_id', '=', $restriction['value'] );
      }
      else if( 'cohort' == $restriction['name'] )
      {
        $modifier->where( 'cohort.id', '=', $restriction['value'] );
      }
    }

    // we need to get the site restriction in order to restrict transcriptions by site
    $report_restriction_sel = lib::create( 'database\select' );
    $report_restriction_sel->add_table_column( 'report_has_report_restriction', 'value' );
    $report_restriction_sel->add_column( 'name' );
    $report_restriction_sel->add_column( 'restriction_type' );
    $report_restriction_sel->add_column( 'subject' );
    $report_restriction_sel->add_column( 'operator' );
    $report_restriction_mod = lib::create( 'database\modifier' );
    $report_restriction_mod->where( 'subject', '=', 'site' );
    $restriction_list =
      $this->db_report->get_report_restriction_list( $report_restriction_sel, $report_restriction_mod );

    if( 0 < count( $restriction_list ) )
    {
      $restriction = current( $restriction_list );
      $modifier->where( 'transcription.site_id', '=', $restriction['value'] );
    }

    // set up requirements
    $this->apply_restrictions( $modifier );

    $select = lib::create( 'database\select' );
    $select->from( 'transcription' );
    $select->add_column( 'cohort.name', 'Cohort', false );
    $select->add_column( 'participant.uid', 'UID', false );
    if( $this->db_role->all_sites ) $select->add_column( 'site.name', 'Site', false );
    $select->add_column(
      'GROUP_CONCAT('."\n".
      '  DISTINCT language.name'."\n".
      '  ORDER BY language.name'."\n".
      '  SEPARATOR ","'."\n".
      ')',
      'Language',
      false
    );
    $select->add_column(
      'GROUP_CONCAT('."\n".
      '  CONCAT( "[", user.name, "] for ", test_type.name, ": ", test_entry_note.note )'."\n".
      '  ORDER BY test_entry_note.datetime'."\n".
      '  SEPARATOR "\\n"'."\n".
      ')',
      'Notes',
      false
    );

    $this->add_table_from_select( NULL, $phone_call_class_name::select( $select, $modifier ) );
  }
}
