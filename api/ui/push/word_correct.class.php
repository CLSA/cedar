<?php
/**
 * word_correct.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: word correct
 */
class word_correct extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'word', 'correct', $args );
  }
  
  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $test_class_name = lib::get_class_name( 'database\test' );

    // make sure the word exists and is in a variant dictionary which is not used by a ranked word test type
    $db_word = lib::create( 'database\word', $this->get_argument( 'word_id' ) );
    if( is_null( $db_word ) )
      throw lib::create( 'exception\runtime', 'Tried to correct a word that cannot be found.', __METHOD__ );
    
    $db_dictionary = $db_word->get_dictionary();
    if( false === stripos( $db_dictionary->name, 'variant' ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'Tried to correct a word "%s" that either doesn\'t exist or isn\'t in a variant dictionary.',
          $db_word->word ),
        __METHOD__ );

    $test_mod = lib::create( 'database\modifier' );
    $test_mod->where( 'variant_dictionary_id', '=', $db_dictionary->id );
    $test_mod->where( 'test_type.name', '=', 'ranked_word' );
    if( 0 < $test_class_name::count( $test_mod ) )
      throw lib::create( 'exception\notice',
        'This word is used by ranked-word type tests which cannot be changed.',
        __METHOD__ );

    // make sure the correction isn't an empty string and isn't the same as the word
    $correction = $this->get_argument( 'correction' );
    if( 0 == strlen( $correction ) )
      throw lib::create( 'exception\notice', 'Please provide a correction.', __METHOD__ );

    if( $db_word->word === $correction )
      throw lib::create( 'exception\notice',
        'Your correction does not change the spelling of the word.  If the word is already spelled correctly '.
        'then you can transfer it to the associated primary dictionary by changing the "Dictionary" dropdown.',
        __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $dictionary_class_name = lib::get_class_name( 'database\dictionary' );
    $word_class_name = lib::get_class_name( 'database\word' );
    $test_class_name = lib::get_class_name( 'database\test' );

    $db_word = lib::create( 'database\word', $this->get_argument( 'word_id' ) );
    $correction = $this->get_argument( 'correction' );

    // this word has to come from a variant dictionary, so get the corresponding dictionaries
    $db_variant_dictionary = $db_word->get_dictionary();
    $primary_name = str_ireplace( 'variant', 'primary', $db_variant_dictionary->name );
    $db_primary_dictionary = $dictionary_class_name::get_unique_record( 'name', $primary_name );
    $mispelled_name = str_ireplace( 'variant', 'mispelled', $db_variant_dictionary->name );
    $db_mispelled_dictionary = $dictionary_class_name::get_unique_record( 'name', $mispelled_name );

    if( is_null( $db_primary_dictionary ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'There is no primary dictionary corresponding to the variant dictionary "%s". '.
          'Expecting to find a dictionary named "%s" (case-insensitive).',
          $db_variant_dictionary->name,
          $primary_name ),
        __METHOD__ );

    if( is_null( $db_mispelled_dictionary ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'There is no mispelled dictionary corresponding to the variant dictionary "%s". '.
          'Expecting to find a dictionary named "%s" (case-insensitive).',
          $db_variant_dictionary->name,
          $mispelled_name ),
        __METHOD__ );

    // see if the corrected word already exists in any of the corresponding dictionaries
    $db_corrected_word = NULL;
    $word_mod = lib::create( 'database\modifier' );
    $word_mod->where( 'word', '=', $correction );
    $word_mod->where( 'language_id', '=', $db_word->language_id );
    $word_mod->where( 'dictionary_id', 'IN',
      array( $db_primary_dictionary->id, $db_mispelled_dictionary->id ) );

    $word_list = $word_class_name::select( $word_mod );
    if( 0 < count( $word_list ) )
    {
      // the word was found in either the primary or mispelled dictionary (it can only be one of the two)
      $db_corrected_word = current( $word_list );
      if( $db_corrected_word->get_dictionary()->id == $db_mispelled_dictionary->id )
        throw lib::create( 'exception\notice',
          'The correction you have provided is already in the corresponding mispelled dictionary '.
          'so it cannot be used.',
          __METHOD__ );
    }

    if( is_null( $db_corrected_word ) )
    { // word isn't in the primary dictionary, so create it
      $db_corrected_word = lib::create( 'database\word' );
      $db_corrected_word->dictionary_id = $db_primary_dictionary->id;
      $db_corrected_word->language_id = $db_word->language_id;
      $db_corrected_word->word = $correction;
      $db_corrected_word->save();
    }

    // now find all uses of the old word in tests and transfer it to the corrected word
    $test_mod = lib::create( 'database\modifier' );
    $test_mod->where( 'variant_dictionary_id', '=', $db_variant_dictionary->id );
    foreach( $test_class_name::select( $test_mod ) as $db_test )
    {
      $test_type = $db_test->get_test_type()->name;
      $sql = sprintf(
        'UPDATE test_entry_%s '.
        'SET word_id = %s '.
        'WHERE word_id = %s',
        $test_type,
        $word_class_name::db()->format_string( $db_corrected_word->id ),
        $word_class_name::db()->format_string( $db_word->id ) );
      $word_class_name::db()->execute( $sql );
    }

    // and finally, move the word to the corresponding mispelled dictionary
    $db_word->dictionary_id = $db_mispelled_dictionary->id;
    $db_word->save();
  }
}
