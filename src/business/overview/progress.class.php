<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\business\overview;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * overview: progress
 */
class progress extends \cenozo\business\overview\base_overview
{
  /**
   * Implements abstract method
   */
  protected function build()
  {
    $transcription_class_name = lib::get_class_name( 'database\transcription' );
    $test_type_class_name = lib::get_class_name( 'database\test_type' );

    $session = lib::create( 'business\session' );
    $db = $session->get_database();
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // get a list of all test types
    $test_type_mod = lib::create( 'database\modifier' );
    $test_type_mod->order( 'rank' );
    $test_type_list = array();
    foreach( $test_type_class_name::select_objects( $test_type_mod ) as $db_test_type )
      $test_type_list[] = $db_test_type->name;

    // get a list of all sites
    $site_sel = lib::create( 'database\select' );
    $site_sel->add_column( 'name' );
    $site_mod = lib::create( 'database\modifier' );
    if( !$db_role->all_sites ) $site_mod->where( 'site.id', '=', $db_site->id );
    $site_mod->order( 'name' );
    $site_list = array();
    foreach( $db_application->get_site_list( $site_sel, $site_mod ) as $site ) $site_list[] = $site['name'];

    // setup the entries for all sites and test-types
    $node_list = array();
    foreach( $site_list as $site )
    {
      $site_node = $this->add_root_item( $site );
      $assigned_node = $this->add_item( $site_node, 'Assigned' );
      $deferred_node = $this->add_item( $site_node, 'Deferred' );
      $submitted_node = $this->add_item( $site_node, 'Submitted' );
      $node_list[$site] = array(
        'assigned' => array( 'transcription' => $this->add_item( $assigned_node, 'Any', 0 ) ),
        'deferred' => array( 'transcription' => $this->add_item( $deferred_node, 'Any', 0 ) ),
        'submitted' => array( 'transcription' => $this->add_item( $submitted_node, 'Any', 0 ) )
      );
      foreach( $test_type_list as $test_type )
      {
        $node_list[$site]['assigned'][$test_type] = $this->add_item( $assigned_node, $test_type, 0 );
        $node_list[$site]['deferred'][$test_type] = $this->add_item( $deferred_node, $test_type, 0 );
        $node_list[$site]['submitted'][$test_type] = $this->add_item( $submitted_node, $test_type, 0 );
      }
    }

    // fill in the test-type data
    $select = lib::create( 'database\select' );
    $select->add_table_column( 'site', 'name', 'site' );
    $select->add_table_column( 'test_entry', 'state' );
    $select->add_table_column( 'test_type', 'name', 'type' );
    $select->add_column( 'COUNT(*)', 'total', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'site', 'transcription.site_id', 'site.id' );
    $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
    $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    if( !$db_role->all_sites ) $modifier->where( 'site.id', '=', $db_site->id );
    $modifier->group( 'site.name' );
    $modifier->group( 'test_entry.state' );
    $modifier->group( 'test_type.name' );

    foreach( $transcription_class_name::select( $select, $modifier ) as $row )
      $node_list[$row['site']][$row['state']][$row['type']]->set_value( $row['total'] );

    // fill in the completed transcription data
    $select = lib::create( 'database\select' );
    $select->add_table_column( 'site', 'name', 'site' );
    $select->add_column( 'end_datetime IS NOT NULL', 'completed' );
    $select->add_column( 'assigned_count > 0', 'assigned' );
    $select->add_column( 'deferred_count > 0', 'deferred' );
    $select->add_column( 'COUNT(*)', 'total', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'site', 'transcription.site_id', 'site.id' );
    $modifier->group( 'site.name' );
    $modifier->group( 'end_datetime IS NOT NULL' );
    $modifier->group( 'assigned_count > 0' );
    $modifier->group( 'deferred_count > 0' );

    foreach( $transcription_class_name::select( $select, $modifier ) as $row )
    {
      if( $row['completed'] )
      {
        $node_list[$row['site']]['submitted']['transcription']->set_value( $row['total'] );
      }
      else
      {
        if( $row['assigned'] )
        {
          $node_list[$row['site']]['assigned']['transcription']->set_value(
            $node_list[$row['site']]['assigned']['transcription']->get_value() + $row['total']
          );
        }
        if( $row['deferred'] )
        {
          $node_list[$row['site']]['deferred']['transcription']->set_value(
            $node_list[$row['site']]['deferred']['transcription']->get_value() + $row['total']
          );
        }
      }
    }

    // create summary node and finish
    /////////////////////////////////////////////////////////////////////////////////////////////
    $first_node = NULL;
    if( $db_role->all_sites )
    {
      // create a summary node of all sites
      $first_node = $this->root_node->get_summary_node();
      if( !is_null( $first_node ) )
      {
        $first_node->set_label( 'Summary of All Sites' );
        $this->root_node->add_child( $first_node, true );
      }
    }
    else
    {
      $first_node = $this->root_node->find_node( $db_site->name );
    }
  }
}
