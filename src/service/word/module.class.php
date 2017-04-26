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

    $db = lib::create( 'business\session' )->get_database();

    // we must always join to the language table (for the word module's typeaheads)
    $modifier->left_join( 'language', 'word.language_id', 'language.id' );

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
      // include the sister language/word as supplemental data
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

    // add the total number of test_entries using the word
    if( $select->has_column( 'test_entry_count' ) )
    {
      $select->add_column( 'word_test_entry_total.total', 'test_entry_count', false );
      $modifier->join( 'word_test_entry_total', 'word.id', 'word_test_entry_total.word_id' );
    }

    // add the total number of uses in each test-type
    if( $select->has_column( 'aft_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'word' );
      $join_sel->add_column( 'id', 'word_id' );
      $join_sel->add_column( 'IF( aft_data.id IS NULL, 0, COUNT(*) )', 'aft_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'aft_data', 'word.id', 'aft_data.word_id' );
      $join_mod->group( 'word.id' );

      $db->execute( sprintf(
        'CREATE TEMPORARY TABLE word_join_aft ( '.
          'INDEX dk_word_id( word_id ) '.
        ') %s %s',
        $join_sel->get_sql(),
        $join_mod->get_sql()
      ) );

      $modifier->join( 'word_join_aft', 'word.id', 'word_join_aft.word_id' );
      $select->add_column( 'IFNULL( aft_count, 0 )', 'aft_count', false );
    }

    if( $select->has_column( 'fas_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'word' );
      $join_sel->add_column( 'id', 'word_id' );
      $join_sel->add_column( 'IF( fas_data.id IS NULL, 0, COUNT(*) )', 'fas_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'fas_data', 'word.id', 'fas_data.word_id' );
      $join_mod->group( 'word.id' );

      $db->execute( sprintf(
        'CREATE TEMPORARY TABLE word_join_fas ( '.
          'INDEX dk_word_id( word_id ) '.
        ') %s %s',
        $join_sel->get_sql(),
        $join_mod->get_sql()
      ) );

      $modifier->join( 'word_join_fas', 'word.id', 'word_join_fas.word_id' );
      $select->add_column( 'IFNULL( fas_count, 0 )', 'fas_count', false );
    }

    if( $select->has_column( 'rey_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'word' );
      $join_sel->add_column( 'id', 'word_id' );
      $join_sel->add_column( 'IF( rey_data_has_word.rey_data_id IS NULL, 0, COUNT(*) )', 'rey_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'rey_data_has_word', 'word.id', 'rey_data_has_word.word_id' );
      $join_mod->group( 'word.id' );

      $db->execute( sprintf(
        'CREATE TEMPORARY TABLE word_join_rey ( '.
          'INDEX dk_word_id( word_id ) '.
        ') %s %s',
        $join_sel->get_sql(),
        $join_mod->get_sql()
      ) );

      $modifier->join( 'word_join_rey', 'word.id', 'word_join_rey.word_id' );
      $select->add_column( 'IFNULL( rey_count, 0 )', 'rey_count', false );
    }
  }
}
