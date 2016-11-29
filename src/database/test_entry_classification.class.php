<?php
/**
 * test_entry_classification.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry_classification: record
 */
class test_entry_classification extends \cenozo\database\has_rank
{
  /**
   * Compare test_entry_classification lists.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return bool true if identical
   */
  public static function compare( $rhs_list, $lhs_list )
  {
    $rhs_data = array();
    foreach( $rhs_list as $item )
      $rhs_data[] = is_null($item->word_id) ? 0 : $item->word_id;
    $lhs_data = array();
    foreach( $lhs_list as $item )
      $lhs_data[] = is_null($item->word_id) ? 0 : $item->word_id;

    $rhs_num = count( $rhs_data );
    $lhs_num = count( $lhs_data );
    if( $rhs_num > $lhs_num )
      $lhs_data = array_pad( $lhs_data, $rhs_num, 0 );
    else if( $lhs_num > $rhs_num )
      $rhs_data = array_pad( $rhs_data, $lhs_num, 0 );

    return 0 == count( array_diff_assoc( $lhs_data, $rhs_data ) );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'test_entry';
}
