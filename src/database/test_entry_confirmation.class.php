<?php
/**
 * test_entry_confirmation.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry_confirmation: record
 */
class test_entry_confirmation extends \cenozo\database\record
{
  /**
   * Compare test_entry_confirmation lists.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return bool true if identical
   */
  public static function compare( $lhs_list, $rhs_list )
  {
    $rhs_data = array();
    foreach( $rhs_list as $item )
      $rhs_data[] = is_null($item->confirmation) ? 'null' : $item->confirmation;
    $lhs_data = array();
    foreach( $lhs_list as $item )
      $lhs_data[] = is_null($item->confirmation) ? 'null' : $item->confirmation;

    $rhs_num = count( $rhs_data );
    $lhs_num = count( $lhs_data );
    if( $rhs_num > $lhs_num )
      $lhs_data = array_pad( $lhs_data, $rhs_num, 0 );
    else if( $lhs_num > $rhs_num )
      $rhs_data = array_pad( $rhs_data, $lhs_num, 0 );

    return 0 == count( array_diff_assoc( $lhs_data, $rhs_data ) );
  }
}
