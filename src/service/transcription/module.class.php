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

    // special restricts for typists
    if( 'typist' == $db_role->name )
    {
      $modifier->where( 'transcription.user_id', '=', $db_user->id );
      $modifier->where( 'transcription.end_datetime', '=', NULL );
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