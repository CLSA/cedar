<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\transcription_event_type;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->join( 'cohort', 'transcription_event_type.cohort_id', 'cohort.id' );
    $modifier->join( 'event_type', 'transcription_event_type.event_type_id', 'event_type.id' );
  }
}
