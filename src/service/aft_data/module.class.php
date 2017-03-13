<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\aft_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cedar\service\base_data_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->join( 'word', 'aft_data.word_id', 'word.id' );
    $modifier->join( 'language', 'word.language_id', 'language.id' );

    if( $select->has_column( 'word_type' ) )
    {
      $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );

      $select->add_column(
        'IF('."\n".
          'word.aft_valid IS NULL,'."\n".
          '"variant",'."\n".
          'IF('."\n".
            'word.aft_valid AND SUBSTRING( word, 1, 1 ) = SUBSTRING( test_type.name, 1, 1 ),'."\n".
            '"primary",'."\n".
            '"intrusion" '."\n".
          ')'."\n".
        ')',
        'word_type',
        false
      );
    }
  }
}
