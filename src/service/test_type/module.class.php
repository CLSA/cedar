<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_type;
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

    if( $select->has_column( 'average_score' ) )
    {
      $modifier->left_join( 'test_entry', 'test_type.id', 'test_entry.test_type_id' );
      $modifier->group( 'test_type.id' );
      $select->add_column( 'ROUND( AVG( test_entry.score ), 2 )', 'average_score', false );
    }

    if( $select->has_column( 'average_alt_score' ) )
    {
      $modifier->left_join( 'test_entry', 'test_type.id', 'test_entry.test_type_id' );
      $modifier->group( 'test_type.id' );
      $select->add_column( 'ROUND( AVG( test_entry.alt_score ), 2 )', 'average_alt_score', false );
    }
  }
}
