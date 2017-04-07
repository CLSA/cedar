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
    {
      $modifier->left_join( 'word', 'word.sister_word_id', 'sister_word.id', 'sister_word' );
    }
    else if( $select->has_column( 'sister_list' ) )
    {
      $modifier->left_join( 'word', 'word.id', 'sister_word.sister_word_id', 'sister_word' );
      $modifier->group( 'word.id' );
      $select->add_column( 'GROUP_CONCAT( sister_word.word )', 'sister_list', false );
    }
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
    else if( $this->get_argument( 'rey_words', false ) )
    {
      $rey_data_variant_class_name = lib::get_class_name( 'database\rey_data_variant' );
      $rey_data_variant_sel = lib::create( 'database\select' );
      $rey_data_variant_sel->from( 'rey_data_variant' );
      $rey_data_variant_sel->add_column( 'word_id' );
      $rey_data_variant_sel->get_distinct();

      // restrict to the REY primary and variant words
      $modifier->where_bracket( true );
      $modifier->where_bracket( true );
      $modifier->where( 'word.word', 'IN', $rey_data_variant_class_name::get_enum_values( 'word' ) );
      $modifier->where( 'language.code', '=', 'en' );
      $modifier->where_bracket( false );
      $modifier->or_where( 'word.id', 'IN', sprintf( '( %s )', $rey_data_variant_sel->get_sql() ), false );
      $modifier->where_bracket( false );
    }
  }
}
