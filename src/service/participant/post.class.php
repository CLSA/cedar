<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\participant;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\participant\post
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    // Cedar needs to treat the uid_list for CRFs differently that the framework
    if( $this->get_argument( 'crf', false ) )
    {
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $sound_file_class_name = lib::get_class_name( 'database\sound_file' );

      $file = $this->get_file_as_array();
      if( array_key_exists( 'uid_list', $file ) )
      {
        // only include participants who DO NOT have an entry in the participant_sound_file_total table
        $modifier = lib::create( 'database\modifier' );
        $modifier->left_join(
          'participant_sound_file_total', 'participant.id', 'participant_sound_file_total.participant_id' );
        $modifier->where( 'participant_sound_file_total.total', '=', NULL );
        $uid_list = $participant_class_name::get_valid_uid_list( $file['uid_list'], $modifier );
        
        if( array_key_exists( 'crf', $file ) )
        {
          $sound_file_mod = lib::create( 'database\modifier' );
          $sound_file_mod->where( 'uid', 'IN', $uid_list );
          $sound_file_class_name::force_add_participant_list( $modifier );
        }
        else // return a list of all valid uids (which ARE NOT yet imported)
        {
          $this->set_data( $uid_list );
        }
      }
    }
    else parent::execute();
  }

  /**
   * Extends parent method
   */
  protected function create_resource( $index )
  {
    return NULL;
  }
}
