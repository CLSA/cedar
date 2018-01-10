<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\self;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Special service for handling the get meta-resource
 */
class get extends \cenozo\service\self\get
{
  /**
   * Override parent method since self is a meta-resource
   */
  protected function create_resource( $index )
  {
    $session = lib::create( 'business\session' );
    $resource = parent::create_resource( $index );

    $setting_sel = lib::create( 'database\select' );
    $setting_sel->from( 'setting' );
    $setting_sel->add_all_table_columns();
    $resource['setting'] = $session->get_setting()->get_column_values( $setting_sel );

    $special_letter_class_name = lib::get_class_name( 'database\special_letter' );
    $special_letter_sel = lib::create( 'database\select' );
    $special_letter_sel->from( 'special_letter' );
    $special_letter_sel->add_column( 'language_id' );
    $special_letter_sel->add_column( 'GROUP_CONCAT( letter SEPARATOR "" )', 'letters', false );
    $special_letter_mod = lib::create( 'database\modifier' );
    $special_letter_mod->group( 'language_id' );
    $resource['setting']['special_letter'] = array();
    foreach( $special_letter_class_name::select( $special_letter_sel, $special_letter_mod ) as $row )
      $resource['setting']['special_letter'][$row['language_id']] = $row['letters'];

    return $resource;
  }
}
