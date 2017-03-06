<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\participant;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\participant\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // restrict by sound file
    $modifier->join(
      'participant_sound_file_total',
      'participant.id',
      'participant_sound_file_total.participant_id'
    );

    if( $select->has_table_columns( 'transcription' ) )
    {
      $modifier->left_join( 'transcription', 'participant.id', 'transcription.participant_id' );

      if( $select->has_table_column( 'transcription', 'state' ) )
      {
        $select->add_table_column(
          'transcription',
          'IF( '.
            'transcription.id IS NULL, '.
            'NULL, '.
            'CONCAT_WS( ", ", '.
              'IF( 0 < assigned_count, "assigned", NULL ), '.
              'IF( 0 < deferred_count, "deferred", NULL ), '.
              'IF( 0 = assigned_count AND 0 = deferred_count, "completed", NULL ) '.
            ') '.
          ')',
          'state',
          false
        );
      }
    }
  }
}
