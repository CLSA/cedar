<?php
/**
 * test_entry_ranked_word_edit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: test_entry_ranked_word edit
 *
 * Edit a ranked word test entry.
 */
class test_entry_ranked_word_edit extends \cenozo\ui\push\base_edit
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry_ranked_word', $args );
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
      if( '' === $candidate )
      {
        $columns = $this->get_argument( 'columns', array() );
        if( !array_key_exists( 'selection', $columns ) &&
            'variant' == $this->get_record()->selection )
          throw lib::create( 'exception\notice',
            'An empty word cannot be set as a variant.',
            __METHOD__ );
      }
      else
      {
        $word_class_name = lib::get_class_name( 'database\word' );
        if( !$word_class_name::is_valid_word( $candidate ) )
          throw lib::create( 'exception\notice',
            'The word "'. $candidate . '" is not a valid word entry.',
            __METHOD__ );
      }
    }
  }

  /**
   * This method executes the operation's purpose.
   * This type of test has two possible sources of edits from the UI layer:
   * 1) when a text entry field for a variant or intrusion changes
   * 2) when a selection changes
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $word_class_name = lib::get_class_name( 'database\word' );

    $db_test_entry_ranked_word = $this->get_record();
    $db_test_entry = $db_test_entry_ranked_word->get_test_entry();
    $candidate = $this->get_argument( 'candidate', NULL );

    if( !is_null( $candidate ) )
    {
      if( '' === $candidate )
      {
        $db_test_entry_ranked_word->word_id = NULL;
      }
      else
      {
        $db_language = current( $db_test_entry->get_language_list() );
        $db_test = $db_test_entry->get_test();
        $data = NULL;
        $data = $db_test->get_word_classification( $candidate, NULL, $db_language );

        $classification = $data['classification'];
        $word = $data['word'];
        $word_id = $data['word_id'];

        // check if mispelled and throw an exception
        if( 'mispelled' == $classification )
          throw lib::create( 'exception\notice',
            'The word "'. $word . '" is a mispelled word and cannot be accepted.',
            __METHOD__ );

        if( 'variant' == $db_test_entry_ranked_word->selection )
        {
          if( 'variant' != $classification )
            throw lib::create( 'exception\notice',
              'The word "' . $word . '" is not one of the '.
              'accepted variant words: add as an intrusion instead.',
               __METHOD__ );

          $db_test_entry_ranked_word->word_id = $word_id;
        }
        // NULL ranked_word_set_id implies test_entry was created for an intrusion
        else if( is_null( $db_test_entry_ranked_word->ranked_word_set_id ) )
        {
          // reject words that are in the primary or variant dictionaries
          if( 'primary' == $classification || 'variant' == $classification )
            throw lib::create( 'exception\notice',
              'The word "' . $word . '" is one of the '.
              $classification . ' words and cannot be entered as an intrusion.',
              __METHOD__ );

          // not a primary or variant
          if( 'candidate' == $classification )
          {
            //get the test's intrusion dictionary and add it as an intrusion
            $db_dictionary = $db_test->get_intrusion_dictionary();
            if( is_null( $db_dictionary ) )
              throw lib::create( 'exception\notice',
                'Trying to add the word "'. $word . '" to a non-existant intrusion dictionary. '.
                'Assign an intrusion dictionary for the '. $db_test->name . ' test.',
                 __METHOD__ );

            $session = lib::create( 'business\session' );
            $session->acquire_semaphore();
            $db_new_word = lib::create( 'database\word' );
            $db_new_word->dictionary_id = $db_dictionary->id;
            $db_new_word->word = $word;
            $db_new_word->language_id = $db_language->id;
            $db_new_word->save();
            $db_test_entry_ranked_word->word_id = $word_class_name::db()->insert_id();
            $session->release_semaphore();
          }
          // it is an existing intrusion
          else
          {
            $db_test_entry_ranked_word->word_id = $word_id;
          }
        }
      }
      $db_test_entry_ranked_word->save();
    }

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $assignment_manager::complete_test_entry( $db_test_entry );
  }
}
