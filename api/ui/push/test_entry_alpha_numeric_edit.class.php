<?php
/**
 * test_entry_alpha_numeric_edit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: test_entry_alpha_numeric edit
 *
 * Edit a alpha_numeric test entry.
 */
class test_entry_alpha_numeric_edit extends \cenozo\ui\push\base_edit
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry_alpha_numeric', $args );
  }

  /**
   * Validate the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $candidate = $this->get_argument( 'candidate', NULL );

    if( !is_null( $candidate ) )
    {
      $word_class_name = lib::get_class_name( 'database\word' );
      if( !$word_class_name::is_valid_word( $candidate, true ) )
        throw lib::create( 'exception\notice',
          'The word "'. $candidate . '" must be a letter or a number.',
          __METHOD__ );
    }
  }

  /**
   * This method executes the operation's purpose.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $word_class_name = lib::get_class_name( 'database\word' );

    $db_test_entry_alpha_numeric = $this->get_record();
    $db_test_entry = $db_test_entry_alpha_numeric->get_test_entry();
    $candidate = $this->get_argument( 'candidate', NULL );

    if( !is_null( $candidate ) )
    {
      if( '' ===  $candidate )
      {
        $db_test_entry_alpha_numeric->word_id = NULL;
      }
      else
      {
        $db_language = current( $db_test_entry->get_language_list() );

        // does the word candidate exist in the primary dictionary?
        $db_dictionary = $db_test_entry->get_test()->get_dictionary();
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'dictionary_id', '=', $db_dictionary->id );
        $modifier->where( 'language_id', '=', $db_language->id );
        $modifier->where( 'word', '=', $candidate );
        $modifier->limit( 1 );

        $db_word = current( $word_class_name::select( $modifier ) );
        if( false !== $db_word )
        {
          $db_test_entry_alpha_numeric->word_id = $db_word->id;
        }
        else
        {
          $session = lib::create( 'business\session' );
          $session->acquire_semaphore();
          $db_new_word = lib::create( 'database\word' );
          $db_new_word->dictionary_id = $db_dictionary->id;
          $db_new_word->word = $candidate;
          $db_new_word->language_id = $db_language->id;
          $db_new_word->save();
          $db_test_entry_alpha_numeric->word_id = $word_class_name::db()->insert_id();
          $session->release_semaphore();
        }
      }
      $db_test_entry_alpha_numeric->save();
    }

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $assignment_manager::complete_test_entry( $db_test_entry );
  }
}
