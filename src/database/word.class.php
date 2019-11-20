<?php
/**
 * word.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * word: record
 */
class word extends \cenozo\database\record
{
  /**
   * Extend parent method
   */
  public function __set( $column_name, $value )
  {
    // check that there are no letter conflicts
    if( ( 'word' == $column_name && !is_null( $this->language_id ) ) ||
        ( 'language_id' == $column_name && !is_null( $this->word ) ) )
    {
      if( 'word' == $column_name ) $value = strtolower( str_replace( "`", "'", $value ) );
      $language_id = 'language_id' == $column_name ? $value : $this->language_id;
      $word = 'word' == $column_name ? $value : $this->word;

      $test = 'a-z';
      $special_letter_class_name = lib::get_class_name( 'database\special_letter' );
      $special_letter_sel = lib::create( 'database\select' );
      $special_letter_sel->from( 'special_letter' );
      $special_letter_sel->add_column( 'GROUP_CONCAT( letter SEPARATOR "" )', 'letters', false );
      $special_letter_mod = lib::create( 'database\modifier' );
      $special_letter_mod->group( 'language_id' );
      $special_letter_mod->where( 'language_id', '=', $language_id );
      $special_letter_list = $special_letter_class_name::select( $special_letter_sel, $special_letter_mod );
      if( 0 < count( $special_letter_list ) )
        $test .= current( $special_letter_list )['letters'];

      if( !preg_match( sprintf( "/^[%s][-' %s]*[%s]$/", $test, $test, $test ), $word ) )
        throw lib::create( 'exception\argument', $column_name, $value, __METHOD__ );
    }

    parent::__set( $column_name, $value );
  }

  /**
   * Updates the word's data (AFT, FAS, misspelled) based on any compound words the base word may have.
   * 
   * If the word has no compound words this method does nothing
   * @access public
   */
  public function update_based_on_compound_words()
  {
    $compound_sel = lib::create( 'database\select' );
    $compound_sel->add_table_column( 'sub_word', 'aft' );
    $compound_sel->add_table_column( 'sub_word', 'fas' );
    $compound_mod = lib::create( 'database\modifier' );
    $compound_mod->join( 'word', 'compound.sub_word_id', 'sub_word.id', '', 'sub_word' );

    $compound_list = $this->get_compound_list( $compound_sel, $compound_mod );
    if( 0 < count( $compound_list ) )
    {
      // words with compound words are always considered to be spelled correctly
      $this->misspelled = false;
      // invalid words should never have compound words, so assume "intrusion" until a compound word says otherwise
      $this->aft = 'intrusion';
      $this->fas = 'intrusion';
      foreach( $compound_list as $compound )
      {
        if( 'primary' == $compound['aft'] ) $this->aft = 'primary';
        if( 'primary' == $compound['fas'] ) $this->fas = 'primary';
      }
      $this->save();
    }
  }

  /**
   * Returns the qualified value for the fas column based on the test type
   * 
   * This is necessary since the f-test has only f-words primary, a-test a-words and s-test s-words
   * @param database\test_type $db_test_type
   * @return string
   * @access public
   */
  public function get_fas( $db_test_type )
  {
    if( is_null( $db_test_type ) || 'fas' != $db_test_type->data_type )
      throw lib::create( 'exception\argument', 'db_test_type', $db_test_type, __METHOD__ );

    $fas = $this->fas;

    if( 'primary' == $this->fas )
    {
      $test_type_letter = strtolower( substr( $db_test_type->name, 0, 1 ) );

      $compound_sel = lib::create( 'database\select' );
      $compound_sel->add_table_column( 'sub_word', 'word' );
      $compound_mod = lib::create( 'database\modifier' );
      $compound_mod->join( 'word', 'compound.sub_word_id', 'sub_word.id', '', 'sub_word' );
      $compound_list = $this->get_compound_list( $compound_sel, $compound_mod );
      if( 0 < count( $compound_list ) )
      {
        // primary if any compound words start with the test-type letter
        $fas = 'intrusion';
        foreach( $compound_list as $compound )
        {
          if( strtolower( substr( $compound['word'], 0, 1 ) ) == $test_type_letter )
          {
            $fas = 'primary';
            break;
          }
        }
      }
      else
      {
        // primary if the word starts with the test-type letter
        $fas = strtolower( substr( $this->word, 0, 1 ) ) == $test_type_letter ? 'primary' : 'intrusion';
      }
    }

    return $fas;
  }
}
