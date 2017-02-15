<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\transcription;
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
      $db_transcription = $this->get_resource();
      if( 'typist' == $db_role->name && !is_null( $db_transcription ) &&
          ( $db_user->id != $db_transcription->user_id || !is_null( $db_transcription->end_datetime ) ) )
      {
        $this->get_status()->set_code( 403 );
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
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    if( $select->has_column( 'uid' ) )
    {
      $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );
      $select->add_column( 'participant.uid', 'uid', false );
    }

    if( $select->has_table_columns( 'user' ) )
      $modifier->left_join( 'user', 'transcription.user_id', 'user.id' );

    // special restricts for typists
    if( 'typist' == $db_role->name )
    {
      $modifier->where( 'transcription.user_id', '=', $db_user->id );
      $modifier->where( 'transcription.assigned_count', '>', 0 );
    }

    if( $select->has_column( 'user_list' ) )
    {
      $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
      $modifier->left_join( 'test_entry_activity', 'test_entry.id', 'test_entry_activity.test_entry_id' );
      $modifier->join( 'user', 'test_entry_activity.user_id', 'activity_user.id', 'left', 'activity_user' );
      $modifier->group( 'transcription.id' );
      $select->add_column(
        'GROUP_CONCAT( DISTINCT activity_user.name ORDER BY test_entry_activity.start_datetime )',
        'user_list',
        false
      );
    }

    if( $select->has_column( 'language_list' ) )
    {
      $modifier->left_join(
        'transcription_has_language',
        'transcription.id',
        'transcription_has_language.transcription_id'
      );
      $modifier->left_join( 'language', 'transcription_has_language.language_id', 'language.id' );
      $select->add_column(
        'GROUP_CONCAT( DISTINCT language.code ORDER BY language.code )',
        'language_list',
        false
      );
    }

    if( $select->has_column( 'state' ) )
    {
      $select->add_column(
        'CONCAT_WS( ", ", '.
          'IF( 0 < assigned_count, "assigned", NULL ), '.
          'IF( 0 < deferred_count, "deferred", NULL ), '.
          'IF( 0 = assigned_count AND 0 = deferred_count, "completed", NULL ) '.
        ')',
        'state',
        false
      );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    $now = util::get_datetime_object();

    if( 'POST' == $this->get_method() )
    {
      $session = lib::create( 'business\session' );
      $record->site_id = $session->get_site()->id;
      $record->start_datetime = $now;
    }
  }
}
