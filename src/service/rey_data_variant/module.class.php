<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data_variant;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    if( $select->has_table_columns( 'variant' ) )
      $modifier->join( 'word', 'rey_data_variant.word_id', 'variant.id', '', 'variant' );

    if( $select->has_column( 'sister_list' ) )
    {
      $modifier->left_join( 'word', 'rey_data_variant.word_id', 'sister_word.sister_word_id', 'sister_word' );
      $modifier->group( 'rey_data_variant.id' );
      $select->add_column( 'GROUP_CONCAT( sister_word.word )', 'sister_list', false );
    }
  }
}
