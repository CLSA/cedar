<?php
/**
 * rey_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * rey_data: record
 */
class rey_data extends base_data
{
  /**
   * Extends parent method
   */
  public function __set( $column_name, $value )
  {
    // Every word in the REY test must either have a yes/no value or a variant, but not both, so
    // if we are setting a word's value or variant to something non-null then set the other to null
    if( !is_null( $value ) )
    {
      $pos = strpos( $column_name, '_rey_data_variant_id' );
      $other_column_name = false !== $pos
                         ? substr( $column_name, 0, $pos )
                         : $column_name.'_rey_data_variant_id';
      if( $this->column_exists( $other_column_name ) ) parent::__set( $other_column_name, NULL );
    }

    parent::__set( $column_name, $value );
  }

  /**
   * Override parent method
   */
  public function get_language()
  {
    // REY data can only have a single language despite having an N-to-N relationship
    $language_list = $this->get_test_entry()->get_language_object_list();
    return current( $language_list );
  }

  /**
   * Override parent method
   */
  public static function initialize( $db_test_entry )
  {
    // create a rey_data record for the test entry
    $db_rey_data = new static();
    $db_rey_data->test_entry_id = $db_test_entry->id;
    $db_rey_data->save();
  }
}
