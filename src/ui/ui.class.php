<?php
/**
 * ui.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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

    $module = $this->get_module( 'language' );
    if( !is_null( $module ) ) $module->add_child( 'special_letter' );

    $module = $this->get_module( 'participant' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'transcription', 'address' );
      $module->add_child( 'sound_file', 'address' );
    }

    $module = $this->get_module( 'test_entry' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'test_entry_activity' );
      $module->add_choose( 'language' );
      $module->add_action( 'notes', '/{identifier}?{search}' );
    }

    $module = $this->get_module( 'status_type' );
    if( !is_null( $module ) ) $module->add_choose( 'test_type' );

    $module = $this->get_module( 'test_type' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'cohort' );
      $module->add_child( 'filename_format' );
      $module->add_choose( 'status_type' );
    }

    $module = $this->get_module( 'transcription' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'test_entry' );
      $module->add_choose( 'language' );
    }

    $module = $this->get_module( 'user' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'transcription', 'access' );
      $module->add_choose( 'cohort' );
    }

    $module = $this->get_module( 'word' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'compound' );
      $module->add_child( 'homophone' );
      $module->add_choose( 'test_entry' );
    }
  }

  /**
   * Extends the sparent method
   */
  protected function build_listitem_list()
  {
    $db_role = lib::create( 'business\session' )->get_role();

    // don't generate the parent list items for typists
    if( 'typist' != $db_role->name )
    {
      parent::build_listitem_list();

      // remove certain default list items
      $this->remove_listitem( 'Availability Types' );
      $this->remove_listitem( 'Form Types' );
      $this->remove_listitem( 'Sources' );
      $this->remove_listitem( 'Strata' );
      if( 2 < $db_role->tier )
      {
        $this->add_listitem( 'Sound Files', 'sound_file' );
        $this->add_listitem( 'REY Variant', 'rey_data_variant' );
        $this->add_listitem( 'Status Types', 'status_type' );
      }
      $this->add_listitem( 'Test Types', 'test_type' );
      $this->add_listitem( 'Words', 'word' );
      $this->add_listitem( 'Homophones', 'homophone' );
    }

    // add application-specific states to the base list
    $this->add_listitem( 'Transcriptions', 'transcription' );

    // remove list items that aren't necessary
    $this->remove_listitem( 'Consent Types' );
    $this->remove_listitem( 'Event Types' );
    $this->remove_listitem( 'Hold Types' );
    $this->remove_listitem( 'States' );
    $this->remove_listitem( 'Proxy Types' );
  }

  /**
   * Extend the parent method
   */
  protected function get_utility_items()
  {
    $db_role = lib::create( 'business\session' )->get_role();
    $list = 'typist' == $db_role->name ? array() : parent::get_utility_items();
    
    unset( $list['Tracing'] );

    if( 2 < $db_role->tier )
      $list['Transcription Multiedit'] = array( 'subject' => 'transcription', 'action' => 'multiedit' );

    // remove export
    if( array_key_exists( 'Participant Export', $list ) ) unset( $list['Participant Export'] );
    return $list;
  }
}
