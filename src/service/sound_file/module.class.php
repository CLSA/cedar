<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\sound_file;
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
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->join( 'participant', 'sound_file.participant_id', 'participant.id' );

    if( $select->has_column( 'name' ) )
    {
      // convert filename into a name
      $select->add_column(
        'CONCAT_WS( " ", REPLACE( filename, "_", " " ), IF( test_type_id IS NULL, "(uncategorized)", "" ) )',
        'name',
        false
      );
    }

    if( $select->has_column( 'url' ) )
    {
      // convert filename into a name
      $select->add_column(
        sprintf(
          'CONCAT_WS( "/", "%s", "%s", participant.uid, CONCAT( sound_file.filename, ".wav" ) )',
          str_replace( '/api', '', ROOT_URL ),
          RECORDINGS_URL
        ),
        'url',
        false
      );
    }
  }
}
