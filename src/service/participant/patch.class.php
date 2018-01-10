<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\participant;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\participant\patch
{
  /**
   * Override the parent method (to update the transcription's assigned user if necessary)
   */
  protected function set_preferred_site()
  {
    parent::set_preferred_site();

    $transcription_class_name = lib::get_class_name( 'database\transcription' );

    // if the participant has a transcription assigned to a user who does not have access to the effective
    // site then unassign them
    $db_participant = $this->get_leaf_record();
    $db_transcription = $transcription_class_name::get_unique_record( 'participant_id', $db_participant->id );
    if( !is_null( $db_transcription ) && !is_null( $db_transcription->user_id ) )
    {
      $db_site = $db_participant->get_effective_site();
      $access_mod = lib::create( 'database\modifier' );
      $access_mod->join( 'role', 'access.role_id', 'role.id' );
      $access_mod->where( 'site_id', '=', $db_site->id );
      $access_mod->where( 'role.name', '=', 'typist' );
      if( 0 == $db_transcription->get_user()->get_access_count( $access_mod ) )
      {
        $db_transcription->user_id = NULL;
        $db_transcription->save();
      }
    }
  }
}
