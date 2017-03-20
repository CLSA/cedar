<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\word;
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

    // we must always join to the language table (for the word module's typeaheads)
    $modifier->left_join( 'language', 'word.language_id', 'language.id' );

    if( $select->has_table_columns( 'animal_word' ) || !is_null( $this->get_resource() ) )
      $modifier->left_join( 'word', 'word.animal_word_id', 'animal_word.id', 'animal_word' );
    if( $select->has_table_columns( 'animal_language' ) || !is_null( $this->get_resource() ) )
      $modifier->left_join( 'language', 'animal_word.language_id', 'animal_language.id', 'animal_language' );
    if( $select->has_table_columns( 'sister_word' ) || !is_null( $this->get_resource() ) )
      $modifier->left_join( 'word', 'word.sister_word_id', 'sister_word.id', 'sister_word' );
    if( $select->has_table_columns( 'sister_language' ) || !is_null( $this->get_resource() ) )
      $modifier->left_join( 'language', 'sister_word.language_id', 'sister_language.id', 'sister_language' );

    if( !is_null( $this->get_resource() ) )
    {
      // include the animal word language/word as supplemental data
      $select->add_column(
        'CONCAT( animal_word.word, " [", animal_language.code, "]" )',
        'formatted_animal_word_id',
        false );
      $select->add_column(
        'CONCAT( sister_word.word, " [", sister_language.code, "]" )',
        'formatted_sister_word_id',
        false );
    }
  }
}
