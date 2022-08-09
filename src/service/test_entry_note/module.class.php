<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_entry_note;
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

    if( $this->service->may_continue() )
    {
      // special restricts for typists
      $db_test_entry_note = $this->get_resource();
      if( 'typist' == $db_role->name && !is_null( $db_test_entry_note ) )
      {
        $db_transcription = $db_test_entry_note->get_test_entry()->get_transcription();
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
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    $modifier->join( 'test_entry', 'test_entry_note.test_entry_id', 'test_entry.id' );
    $modifier->join( 'transcription', 'test_entry.transcription_id', 'transcription.id' );

    // special restricts for typists
    if( 'typist' == $db_role->name )
    {
      $modifier->where( 'transcription.user_id', '=', $db_user->id );
      $modifier->where( 'transcription.end_datetime', '=', NULL );
    }
  }
}
