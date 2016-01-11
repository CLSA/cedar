<?php
/**
 * test_entry_classification_edit.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\push;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * push: test_entry_classification edit
 *
 * Edit a classification test entry.
 */
class test_entry_classification_edit extends \cenozo\ui\push\base_edit
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry_classification', $args );
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
      if( !$word_class_name::is_valid_word( $candidate ) )
        throw lib::create( 'exception\notice',
          'The word "'. $candidate . '" is not a valid word entry.',
          __METHOD__ );
    }
  }

  /**
   * This method executes the operation's purpose.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   * @throws exception\notice
   * @throws exception\runtime
   */
  protected function execute()
  {
    parent::execute();

    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $word_class_name = lib::get_class_name( 'database\word' );

    $db_test_entry_classification = $this->get_record();
    $db_test_entry = $db_test_entry_classification->get_test_entry();
    $candidate = $this->get_argument( 'candidate', NULL );

    if( !is_null( $candidate ) )
    {
      if( '' === $candidate )
      {
        $db_test_entry_classification->word_id = NULL;
      }
      else
      {
        $db_language_list = $db_test_entry->get_language_list();
        $db_test = $db_test_entry->get_test();
        $data = NULL;
        $db_language = NULL;
        foreach( $db_language_list as $language )
        {
          $data = $db_test->get_word_classification( $candidate, NULL, $language );
          if( 'candidate' != $data['classification'] )
          {
            $db_language = $language;
            break;
          }
        }

        if( is_null( $db_language ) )
          $db_language = $db_test_entry->get_default_participant_language();

        $classification = $data['classification'];
        $word = $data['word'];
        $word_id = $data['word_id'];

        if( '' !== $word_id )
        {
          // check if mispelled and throw an exception
          if( 'mispelled' === $classification )
            throw lib::create( 'exception\notice',
              'The word "'. $word . '" is mispelled and cannot be accepted.',
              __METHOD__ );

          $db_test_entry_classification->word_id = $word_id;
        }
        else
        {
          // the word isnt in the primary, variant, intrusion, or mispelled dictionaries
          // determine which dictionary to add the candidate to
          $db_dictionary = NULL;

          if( false !== strpos( $db_test->name, 'FAS' ) )
          {
            $is_intrusion = false;
            // any f words that do not begin with 'f' or 'ph' are intrusions
            if( false !== strpos( $db_test->name, 'f word' ) &&
                0 !== strpos( $word, 'f' ) &&
                0 !== strpos( $word, 'ph' ) )
            {
              $is_intrusion = true;
            }
            // any a words that do not begin with 'a' are intrusions
            else if( false !== strpos( $db_test->name, 'a word' ) &&
                     0 !== strpos( $word, 'a' ) )
            {
              $is_intrusion = true;
            }
            // any s words that do not begin with 's' or 'c' are intrusions
            else if( false !== strpos( $db_test->name, 's word' ) &&
                     0 !== strpos( $word, 's' ) &&
                     0 !== strpos( $word, 'c' ) )
            {
              $is_intrusion = true;
            }

            if( $is_intrusion )
            {
              // get the test's intrusion dictionary and add it as an intrusion
              $db_dictionary = $db_test->get_intrusion_dictionary();
              if( is_null( $db_dictionary ) )
                throw lib::create( 'exception\notice',
                  'Trying to add the word "'. $word . '" to a non-existant intrusion dictionary. '.
                  'Assign an intrusion dictionary for the '. $db_test->name . ' test.',
                  __METHOD__ );
            }
          }

          if( is_null( $db_dictionary ) )
          {
            // get the test's variant dictionary and add it as a variant
            $db_dictionary = $db_test->get_variant_dictionary();

            if( is_null( $db_dictionary ) )
              throw lib::create( 'exception\notice',
                'Trying to add the word "'. $word . '" to a non-existant variant dictionary. '.
                'Assign a variant dictionary for the '. $db_test->name . ' test.',
                __METHOD__ );
          }

          $session = lib::create( 'business\session' );
          $session->acquire_semaphore();
          $db_new_word = lib::create( 'database\word' );
          $db_new_word->dictionary_id = $db_dictionary->id;
          $db_new_word->word = $word;
          $db_new_word->language_id = $db_language->id;
          $db_new_word->save();
          $db_test_entry_classification->word_id = $word_class_name::db()->insert_id();
          $session->release_semaphore();
        }
      }
      $db_test_entry_classification->save();
    }

    $assignment_manager = lib::create( 'business\assignment_manager' );
    $assignment_manager::complete_test_entry( $db_test_entry );
  }
}
