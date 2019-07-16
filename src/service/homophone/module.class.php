<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\homophone;
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

    $modifier->join( 'word', 'homophone.word_id', 'word.id' );
    $modifier->join( 'language', 'word.language_id', 'language.id' );
    $modifier->join( 'word', 'homophone.first_word_id', 'first_word.id', '', 'first_word' );
    $modifier->join( 'language', 'first_word.language_id', 'first_language.id', '', 'first_language' );

    if( !$modifier->has_order( 'rank' ) ) $modifier->order( 'rank' );
  }
}
