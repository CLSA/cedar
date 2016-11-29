<?php
/**
 * ui.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Application extension to ui class
 */
class ui extends \cenozo\ui\ui
{
  /**
   * Extends the parent method
   */
  protected function get_report_items()
  {
    $list = parent::get_report_items();
    $db_role = lib::create( 'business\session' )->get_role();

    // typists get no list items
    if( 'typist' == $db_role->name ) $list = array();

    return $list;
  }
}
