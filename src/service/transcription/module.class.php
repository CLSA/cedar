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
