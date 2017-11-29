<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_entry;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    if( 300 > $this->get_status()->get_code() )
    {
      // special restricts for typists
      $db_test_entry = $this->get_resource();
      if( 'typist' == $db_role->name && !is_null( $db_test_entry ) )
      {
        $db_transcription = $db_test_entry->get_transcription();
        if( $db_user->id != $db_transcription->user_id || !is_null( $db_transcription->end_datetime ) )
        {
          $this->get_status()->set_code( 403 );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    $modifier->join( 'transcription', 'test_entry.transcription_id', 'transcription.id' );
    $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );

    if( $select->has_table_columns( 'site' ) )
    {
      $modifier->join( 'participant_site', 'participant.id', 'participant_site.participant_id' );
      $modifier->left_join( 'site', 'participant_site.site_id', 'site.id' );
      $modifier->where( 'participant_site.application_id', '=', $db_application->id );
    }

    if( $select->has_column( 'prev_test_entry_id' ) || $select->has_column( 'next_test_entry_id' ) )
    {
      if( $select->has_column( 'prev_test_entry_id' ) )
      {
        $modifier->left_join( 'test_type', 'prev_test_type.rank', 'test_type.rank - 1', 'prev_test_type' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'test_type_has_cohort.cohort_id', '=', 'participant.cohort_id', false );
        $join_mod->where( 'test_type_has_cohort.test_type_id', '=', 'prev_test_type.id', false );
        $modifier->join( 'test_type_has_cohort', 'test_type_has_cohort.cohort_id', 'participant.cohort_id' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'prev_test_entry.transcription_id', '=', 'test_entry.transcription_id', false );
        $join_mod->where( 'prev_test_entry.test_type_id', '=', 'prev_test_type.id', false );
        $modifier->join_modifier( 'test_entry', $join_mod, 'left', 'prev_test_entry' );
        $select->add_column( 'prev_test_entry.id', 'prev_test_entry_id', false );
      }

      if( $select->has_column( 'next_test_entry_id' ) )
      {
        $modifier->left_join( 'test_type', 'next_test_type.rank', 'test_type.rank + 1', 'next_test_type' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'test_type_has_cohort.cohort_id', '=', 'participant.cohort_id', false );
        $join_mod->where( 'test_type_has_cohort.test_type_id', '=', 'next_test_type.id', false );
        $modifier->join( 'test_type_has_cohort', 'test_type_has_cohort.cohort_id', 'participant.cohort_id' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'next_test_entry.transcription_id', '=', 'test_entry.transcription_id', false );
        $join_mod->where( 'next_test_entry.test_type_id', '=', 'next_test_type.id', false );
        $modifier->join_modifier( 'test_entry', $join_mod, 'left', 'next_test_entry' );
        $select->add_column( 'next_test_entry.id', 'next_test_entry_id', false );
      }
    }

    if( $select->has_table_column( 'transcription', 'uid' ) )
    {
      $select->add_table_column( 'transcription', 'participant.uid', 'transcription_uid', false );
    }

    // special restricts for typists
    if( 'typist' == $db_role->name )
    {
      $modifier->where( 'transcription.user_id', '=', $db_user->id );
      $modifier->where( 'transcription.end_datetime', '=', NULL );
    }

    if( $select->has_column( 'user_list' ) )
    {
      $modifier->left_join( 'test_entry_activity', 'test_entry.id', 'test_entry_activity.test_entry_id' );
      $modifier->join( 'user', 'test_entry_activity.user_id', 'activity_user.id', 'left', 'activity_user' );
      $modifier->group( 'test_entry.id' );
      $select->add_column(
        'GROUP_CONCAT( DISTINCT activity_user.name ORDER BY test_entry_activity.start_datetime )',
        'user_list',
        false
      );
    }

    if( $select->has_column( 'language_list' ) )
    {
      $modifier->left_join( 'test_entry_has_language', 'test_entry.id', 'test_entry_has_language.test_entry_id' );
      $modifier->left_join( 'language', 'test_entry_has_language.language_id', 'language.id' );
      $modifier->group( 'test_entry.id' );
      $select->add_column(
        'GROUP_CONCAT( DISTINCT language.code ORDER BY language.code )',
        'language_list',
        false
      );
    }
  }
}
