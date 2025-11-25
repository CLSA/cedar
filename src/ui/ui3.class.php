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
  public static function generate()
  {
    $data = parent::generate();

    $db_role = lib::create( 'business\session' )->get_role();

    if( array_key_exists( 'language', $data['module_list'] ) )
    {
      $module = $data['module_list']['language'];
      $module->add_child( 'special_letter' );
    }

    if( array_key_exists( 'participant', $data['module_list'] ) )
    {
      $module = $data['module_list']['participant'];
      $module->add_child( 'transcription', 'address' );
      $module->add_child( 'sound_file', 'address' );
    }

    if( array_key_exists( 'test_entry', $data['module_list'] ) )
    {
      $module = $data['module_list']['test_entry'];
      $module->add_child( 'test_entry_activity' );
      $module->add_choose( 'language' );
      $module->add_action( 'notes', '/{identifier}?{search}' );
    }

    if( array_key_exists( 'status_type', $data['module_list'] ) )
    {
      $module = $data['module_list']['status_type'];
      $module->add_choose( 'test_type' );
    }

    if( array_key_exists( 'test_type', $data['module_list'] ) )
    {
      $module = $data['module_list']['test_type'];
      $module->add_child( 'cohort' );
      $module->add_child( 'filename_format' );
      $module->add_choose( 'status_type' );
    }

    if( array_key_exists( 'transcription', $data['module_list'] ) )
    {
      $module = $data['module_list']['transcription'];
      $module->add_child( 'test_entry' );
      $module->add_choose( 'language' );
    }

    if( array_key_exists( 'user', $data['module_list'] ) )
    {
      $module = $data['module_list']['user'];
      $module->add_child( 'transcription', 'access' );
      $module->add_choose( 'cohort' );
    }

    if( array_key_exists( 'word', $data['module_list'] ) )
    {
      $module = $data['module_list']['word'];
      $module->add_child( 'compound' );
      $module->add_child( 'homophone' );
      $module->add_choose( 'test_entry' );
    }

    // add application-specific menu items
    $menu_list_items = [
      ['subject' => 'transcription', 'title' => 'Transcriptions'],
      ['subject' => 'transcription_event_type', 'title' => 'Transcription Event Types'],
    ];

    // remove menu items that aren't necessary
    unset( $data['menu']['lists']['Consent Types'] );
    unset( $data['menu']['lists']['Event Types'] );
    unset( $data['menu']['lists']['Hold Types'] );
    unset( $data['menu']['lists']['Identifiers'] );
    unset( $data['menu']['lists']['Proxy Types'] );
    unset( $data['menu']['utilities']['Participant Export'] );
    unset( $data['menu']['utilities']['Tracing'] );

    if( 'typist' != $db_role->name )
    {
      unset( $data['menu']['lists']['Availability Types'] );
      unset( $data['menu']['lists']['Form Types'] );
      unset( $data['menu']['lists']['Sources'] );
      unset( $data['menu']['lists']['Strata'] );

      $menu_list_items = array_merge( $menu_list_items, [
        ['subject' => 'test_type', 'title' => 'Test Types'],
        ['subject' => 'word', 'title' => 'Words'],
        ['subject' => 'homophone', 'title' => 'Homophones']
      ]);

      if( 2 < $db_role->tier )
      {
        $menu_list_items = array_merge( $menu_list_items, [
          ['subject' => 'sound_file', 'title' => 'Sound Files'],
          ['subject' => 'status_type', 'title' => 'Status Types']
        ]);
        $data['menu']['utilities']['Transcription Multi-Edit'] = [
          'subject' => 'transcription',
          'action' => 'multiedit'
        ];
      }
    }

    foreach( $menu_list_items as $item )
    {
      if( array_key_exists( $item['subject'], $data['module_list'] ) )
      {
        $module = $data['module_list'][$item['subject']];
        if( $module->get_list_menu() && $module->has_action( 'list' ) )
          $data['menu']['lists'][$item['title']] = $item['subject'];
      }
    }

    return $data;
  }
}
