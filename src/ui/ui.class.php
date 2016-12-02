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
  protected function build_module_list()
  {
    parent::build_module_list();

    $module = $this->get_module( 'user' );
    if( !is_null( $module ) ) $module->add_child( 'transcription', 'access' );
  }

  /**
   * Extends the sparent method
   */
  protected function build_listitem_list()
  {
    $db_role = lib::create( 'business\session' )->get_role();

    // don't generate the parent list items for typists
    if( 'typist' != $db_role->name ) parent::build_listitem_list();

    // add application-specific states to the base list
    $this->add_listitem( 'Transcriptions', 'transcription' );
  }

  /**
   * Extend the parent method
   */
  protected function get_utility_items()
  {
    return 'typist' == lib::create( 'business\session' )->get_role()->name ? array() : parent::get_utility_items();
  }
}
