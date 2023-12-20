<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\word;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all patch services.
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function prepare()
  {
    $this->extract_parameter_list = array_merge(
      $this->extract_parameter_list,
      ['correct_word', 'note']
    );

    parent::prepare();

    $patch_array = parent::get_file_as_array();

    $this->correct_word =
      !is_null( $this->get_argument( 'correct_word', NULL ) ) &&
      array_key_exists( 'misspelled', $patch_array ) &&
      true == $patch_array['misspelled'];

    $this->note =
      !is_null( $this->get_argument( 'note', NULL ) ) &&
      (
        ( array_key_exists( 'misspelled', $patch_array ) && true == $patch_array['misspelled'] ) ||
        ( array_key_exists( 'aft', $patch_array ) && 'invalid' == $patch_array['aft'] ) ||
        ( array_key_exists( 'fas', $patch_array ) && 'invalid' == $patch_array['fas'] )
      );
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      // only admins can edit a word once misspelled, aft and fas have been set
      $db_word = $this->get_leaf_record();
      if( !is_null( $db_word->misspelled ) &&
          !is_null( $db_word->aft ) &&
          !is_null( $db_word->fas ) &&
          'administrator' != lib::create( 'business\session' )->get_role()->name )
      {
        $this->status->set_code( 403 );
      }
      else
      {
        $language_class_name = lib::get_class_name( 'database\language' );
        $db_english_language = $language_class_name::get_unique_record( 'code', 'en' );

        // do not allow a word's sister word to be itself, a word who has a parent or an fas-invalid word
        $patch_array = $this->get_file_as_array();
        if( array_key_exists( 'sister_word_id', $patch_array ) )
        {
          if( !is_null( $patch_array['sister_word_id'] ) )
          {
            $db_sister_word = lib::create( 'database\word', $patch_array['sister_word_id'] );
            if( 0 < $db_word->get_compound_count() )
            {
              $this->status->set_code( 306 );
              $this->set_data( 'Compounded words cannot have a parent sister word.' );
            }
            else if( $db_sister_word->id == $db_word->id )
            {
              $this->status->set_code( 306 );
              $this->set_data( 'A word cannot have itself as its own parent sister word.' );
            }
            else if( 'invalid' == $db_sister_word->fas )
            {
              $this->status->set_code( 306 );
              $this->set_data( 'The parent sister word cannot be used because its FAS status is invalid' );
            }
            else if( !is_null( $db_sister_word->sister_word_id ) )
            {
              $this->status->set_code( 306 );
              $this->set_data( 'The parent sister word cannot be used because it already has its own parent sister word.' );
            }
            else if( $db_english_language->id == $db_word->language_id && $db_sister_word->language_id != $db_word->language_id )
            {
              $this->status->set_code( 306 );
              $this->set_data( 'English words cannot have a non-English parent sister word.' );
            }
            else
            {
              // make sure this word isn't a parent sister word
              $word_class_name = lib::get_class_name( 'database\word' );
              $select = lib::create( 'database\select' );
              $select->add_column( 'word' );
              $select->add_table_column( 'language', 'code' );
              $modifier = lib::create( 'database\modifier' );
              $modifier->join( 'language', 'word.language_id', 'language.id' );
              $modifier->where( 'sister_word_id', '=', $db_word->id );
              $word_list = $word_class_name::select( $select, $modifier );

              if( 0 < count( $word_list ) )
              {
                $list = [];
                foreach( $word_list as $word ) $list[] = sprintf( '"%s" [%s]', $word['word'], $word['code'] );
                $this->status->set_code( 306 );
                $this->set_data( sprintf(
                  'You cannot assign a parent sister to this word since it is already a parent to: %s',
                  implode( ', ', $list )
                ) );
              }
            }
          }
        }
      }
    }
  }

  /**
   * Override parent method
   */
  protected function setup()
  {
    parent::setup();

    // misspelled words are automatically invalid for both AFT and FAS tests
    $db_word = $this->get_leaf_record();
    if( $db_word->misspelled )
    {
      $db_word->aft = 'invalid';
      $db_word->fas = 'invalid';
    }
    // intrusion/primary words are correctly spelled
    else if( 'intrusion' == $db_word->aft || 'primary' == $db_word->aft ||
             'intrusion' == $db_word->fas || 'primary' == $db_word->fas )
    {
      $db_word->misspelled = false;
    }

    if( !$db_word->animal_code && 'primary' == $db_word->aft )
    {
      $db_word->aft = NULL;
    }
    else if( $db_word->animal_code )
    {
      $db_word->aft = 'primary';
      $db_word->misspelled = false;
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    $db_word = $this->get_leaf_record();
    $db_correct_word = NULL;

    // add the corrected word if it exists
    if( $this->correct_word )
    {
      $correct_word = $this->get_argument( 'correct_word' );

      // convert correct word if it is provided as a string
      if( is_string( $correct_word ) )
      {
        $object = new \stdClass();
        $object->language_id = $db_word->language_id;
        $object->word = $correct_word;
        $correct_word = $object;
      }

      if( property_exists( $correct_word, 'id' ) )
      {
        $db_correct_word = lib::create( 'database\word', $correct_word->id );
      }
      else
      {
        // see if the word already exists
        $word_class_name = lib::get_class_name( 'database\word' );
        $db_correct_word = $word_class_name::get_unique_record(
          array( 'language_id', 'word' ),
          array( $correct_word->language_id, $correct_word->word )
        );

        if( is_null( $db_correct_word ) )
        {
          $db_correct_word = lib::create( 'database\word' );
          $db_correct_word->language_id = $correct_word->language_id;
          $db_correct_word->word = $correct_word->word;
          $db_correct_word->misspelled = false;
          $db_correct_word->save();
        }

        if( $db_correct_word->misspelled )
        {
          throw lib::create( 'exception\notice',
            sprintf( 'You cannot correct the misspelled word "%s" with the word "%s" since it is also misspelled.',
                     $db_word->word,
                     $db_correct_word->word ),
            __METHOD__
          );
        }
      }
    }

    parent::execute();

    // if we have a corrected word then find all tests that use the misspelled and change it to the corrected
    if( !is_null( $db_correct_word ) )
    {
      $aft_data_class_name = lib::get_class_name( 'database\aft_data' );
      $fas_data_class_name = lib::get_class_name( 'database\fas_data' );
      $rey_data_class_name = lib::get_class_name( 'database\rey_data' );

      $aft_data_class_name::substitute_word( $db_word, $db_correct_word );
      $fas_data_class_name::substitute_word( $db_word, $db_correct_word );
      $rey_data_class_name::substitute_word( $db_word, $db_correct_word );
    }
  }

  /**
   * Override parent method
   */
  protected function finish()
  {
    parent::finish();

    $db_user = lib::create( 'business\session' )->get_user();

    // If there is no correction word but a note exists then this means we've made a word invalid and
    // all test-entries using it must be re-assigned
    if( !$this->correct_word && $this->note )
    {
      $db_word = $this->get_leaf_record();

      if( 'invalid' == $db_word->aft && 'invalid' == $db_word->fas ) $data_type_list = array( 'rey' );
      if( 'invalid' == $db_word->aft ) $data_type_list[] = 'aft';
      if( 'invalid' == $db_word->fas ) $data_type_list[] = 'fas';

      $test_entry_mod = lib::create( 'database\modifier' );
      $test_entry_mod->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
      $test_entry_mod->where( 'test_type.data_type', 'IN', $data_type_list );
      foreach( $db_word->get_test_entry_object_list( $test_entry_mod ) as $db_test_entry )
      {
        // re-assign the test-entry
        $db_test_entry->state = 'assigned';
        $db_test_entry->save();

        // add the note to the test-entry
        $db_test_entry_note = lib::create( 'database\test_entry_note' );
        $db_test_entry_note->test_entry_id = $db_test_entry->id;
        $db_test_entry_note->user_id = $db_user->id;
        $db_test_entry_note->datetime = util::get_datetime_object();
        $db_test_entry_note->note = $this->get_argument( 'note' );
        $db_test_entry_note->save();

        // re-assign the trascription if it isn't already assigned
        $db_transcription = $db_test_entry->get_transcription();
        if( is_null( $db_transcription->user_id ) )
        {
          // get the last assigned user
          $user_sel = lib::create( 'database\select' );
          $user_sel->add_table_column( 'transcription_has_user', 'user_id' );
          $user_mod = lib::create( 'database\modifier' );
          $user_mod->order_desc( 'transcription_has_user.datetime' );
          $user_mod->limit( 1 );
          $user_list = $db_transcription->get_user_list( $user_sel, $user_mod );

          // if for some reason there is no user then assign it to the admin
          $db_transcription->user_id = 0 < count( $user_list ) ? $user_list[0]['user_id'] : $db_user->id;
          $db_transcription->save();
        }
      }
    }
  }

  /**
   * Whether or not to use the correct_word argument
   * @var boolean
   * @access protected
   */
  protected $correct_word = false;

  /**
   * Whether or not to use the note argument
   * @var boolean
   * @access protected
   */
  protected $note = false;
}
