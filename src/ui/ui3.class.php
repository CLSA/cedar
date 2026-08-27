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
class ui3 extends \cenozo\ui\ui3
{
  /**
   * Extends the parent method
   */
  protected function generate_modules()
  {
    parent::generate_modules();

    $db_role = lib::create( 'business\session' )->get_role();

    $module = $this->get_module( 'language' );
    if( !is_null( $module ) ) $module->add_child( 'special_letter' );

    $module = $this->get_module( 'participant' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'transcription', 'address' );
      $module->add_child( 'sound_file', 'address' );
    }

    foreach( ['aft', 'fas', 'mat', 'premat', 'rey'] as $type )
    {
      $module = $this->get_module( sprintf( '%s_data', $type ) );
      if( !is_null( $module ) ) $module->add_action( 'test' );
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

    $module = $this->get_module( 'transcription' );
    if ( !is_null( $module ) && 2 < $db_role->tier ) $module->add_action( 'multiedit' );
  }

  /**
   * Extends the parent method
   */
  protected function generate_menus()
  {
    parent::generate_menus();

    $db_role = lib::create( 'business\session' )->get_role();

    // remove menus items that aren't necessary
    $this->remove_menu_item( 'list', 'Availability Types' );
    $this->remove_menu_item( 'list', 'Consent Types' );
    $this->remove_menu_item( 'list', 'Event Types' );
    $this->remove_menu_item( 'list', 'Hold Types' );
    $this->remove_menu_item( 'list', 'Identifiers' );
    $this->remove_menu_item( 'list', 'Proxy Types' );
    $this->remove_menu_item( 'list', 'Trace Types' );
    $this->remove_menu_item( 'utility', 'Participant Export' );
    $this->remove_menu_item( 'utility', 'Participant Multi-Edit' );
    $this->remove_menu_item( 'utility', 'Tracing' );

    $this->add_menu_item( 'list', 'Transcriptions', 'transcription' );
    $this->add_menu_item( 'list', 'Transcription Event Types', 'transcription_event_type' );

    if( 'typist' == $db_role->name )
    {
      $this->remove_menu_item( 'list', 'Users' );
      $this->remove_menu_item( 'utility', 'Participant Search' );
      $this->remove_menu_item( 'utility', 'User Overview' );
    }
    else
    {
      $this->remove_menu_item( 'list', 'Form Types' );
      $this->remove_menu_item( 'list', 'Sources' );
      $this->remove_menu_item( 'list', 'Strata' );

      $this->add_menu_item( 'list', 'Test Types', 'test_type' );
      $this->add_menu_item( 'list', 'Words', 'word' );
      $this->add_menu_item( 'list', 'Homophones', 'homophone' );

      if( 2 < $db_role->tier )
      {
        $this->add_menu_item( 'list', 'REY Variants', 'rey_data_variant' );
        $this->add_menu_item( 'list', 'Sound Files', 'sound_file' );
        $this->add_menu_item( 'list', 'Status Types', 'status_type' );
        $this->add_menu_item( 'utility', 'Transcription Multi-Edit', 'transcription', 'multiedit' );
      }
    }
  }
}
