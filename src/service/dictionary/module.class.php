<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\dictionary;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    // don't allow restricted dictionaries to be deleted or edited
    if( in_array( $this->get_method(), array( 'DELETE', 'PATCH' ) ) &&
        $this->is_leaf_module() &&
        $this->get_resource()->reserved ) $this->get_status()->set_code( 403 );
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // add the total number of words
    if( $select->has_column( 'word_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'word' );
      $join_sel->add_column( 'dictionary_id' );
      $join_sel->add_column( 'COUNT(*)', 'word_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'dictionary_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS dictionary_join_word', $join_sel->get_sql(), $join_mod->get_sql() ),
        'dictionary.id',
        'dictionary_join_word.dictionary_id' );
      $select->add_column( 'IFNULL( word_count, 0 )', 'word_count', false );
    }
  }
}
