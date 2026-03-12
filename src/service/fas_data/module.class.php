<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\fas_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cedar\service\base_rank_data_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $modifier->join( 'test_entry', 'fas_data.test_entry_id', 'test_entry.id' );
    $modifier->join( 'transcription', 'test_entry.transcription_id', 'transcription.id' );

    parent::prepare_read( $select, $modifier );
  }
}
