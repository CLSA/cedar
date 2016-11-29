<?php
/**
 * test_entry_ranked_word.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry_ranked_word: record
 */
class test_entry_ranked_word extends \cenozo\database\record
{
  /**
   * Compare test_entry_ranked_word lists.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return bool true if identical
   */
  public static function compare( $rhs_list, $lhs_list )
  {
    $rhs_data = array();
    foreach( $rhs_list as $item )
    {
      if( is_null($item->ranked_word_set_id) )
        $rhs_data[] = is_null($item->word_id) ? 0 : $item->word_id;
      else
        $rhs_data[] = is_null($item->selection) ?
          (is_null($item->word_id) ? 0 : $item->word_id) : $item->selection;
    }
    $lhs_data = array();
    foreach( $lhs_list as $item )
    {
      if( is_null($item->ranked_word_set_id) )
        $lhs_data[] = is_null($item->word_id) ? 0 : $item->word_id;
      else
        $lhs_data[] = is_null($item->selection) ?
          (is_null($item->word_id) ? 0 : $item->word_id) : $item->selection;
    }

    $rhs_num = count( $rhs_data );
    $lhs_num = count( $lhs_data );
    if( $rhs_num > $lhs_num )
      $lhs_data = array_pad( $lhs_data, $rhs_num, 0 );
    else if( $lhs_num > $rhs_num )
      $rhs_data = array_pad( $rhs_data, $lhs_num, 0 );

    return 0 == count( array_diff_assoc( $lhs_data, $rhs_data ) );
  }
}
