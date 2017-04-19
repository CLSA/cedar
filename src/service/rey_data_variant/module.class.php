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

    $modifier->join( 'word', 'rey_data_variant.word_id', 'variant.id', '', 'variant' );
    $modifier->join( 'language', 'variant.language_id', 'variant_language.id', '', 'variant_language' );
  }
}
