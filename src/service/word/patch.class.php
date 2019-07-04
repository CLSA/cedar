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
  public function get_file_as_array()
  {
    // remove correct_word from the patch array
    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'misspelled', $patch_array ) && true == $patch_array['misspelled'] )
    {
      if( array_key_exists( 'correct_word', $patch_array ) )
      {
        $this->correct_word = $patch_array['correct_word'];
        unset( $patch_array['correct_word'] );
      }
    }

    if( ( array_key_exists( 'misspelled', $patch_array ) && true == $patch_array['misspelled'] ) ||
        ( array_key_exists( 'aft', $patch_array ) && 'invalid' == $patch_array['aft'] ) ||
        ( array_key_exists( 'fas', $patch_array ) && 'invalid' == $patch_array['fas'] ) )
    {
      if( array_key_exists( 'note', $patch_array ) )
      {
        $this->note = $patch_array['note'];
        unset( $patch_array['note'] );
      }
    }

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      // only admins can edit a word once misspelled, aft and fas have been set
      $db_word = $this->get_leaf_record();
      if( !is_null( $db_word->misspelled ) &&
          !is_null( $db_word->aft ) &&
          !is_null( $db_word->fas ) &&
          'administrator' != lib::create( 'business\session' )->get_role()->name ) $this->status->set_code( 403 );
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
      $db_word->aft = NULL;
    else if( $db_word->animal_code )
      $db_word->aft = 'primary';
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    $db_word = $this->get_leaf_record();

    // add the corrected word if it exists
    if( !is_null( $this->correct_word ) )
    {
      // convert correct word if it is provided as a string
      if( is_string( $this->correct_word ) )
      {
        $object = new \stdClass();
        $object->language_id = $db_word->language_id;
        $object->word = $this->correct_word;
        $this->correct_word = $object;
      }

      if( property_exists( $this->correct_word, 'id' ) )
      {
        $this->correct_word = lib::create( 'database\word', $this->correct_word->id );
      }
      else
      {
        // see if the word already exists
        $word_class_name = lib::get_class_name( 'database\word' );
        $db_correct_word = $word_class_name::get_unique_record(
          array( 'language_id', 'word' ),
          array( $this->correct_word->language_id, $this->correct_word->word )
        );

        if( is_null( $db_correct_word ) )
        {
          $db_correct_word = lib::create( 'database\word' );
          $db_correct_word->language_id = $this->correct_word->language_id;
          $db_correct_word->word = $this->correct_word->word;
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

        $this->correct_word = $db_correct_word;
      }
    }

    parent::execute();

    // if we have a corrected word then find all tests that use the misspelled and change it to the corrected
    if( !is_null( $this->correct_word ) )
    {
      $aft_data_class_name = lib::get_class_name( 'database\aft_data' );
      $fas_data_class_name = lib::get_class_name( 'database\fas_data' );
      $rey_data_class_name = lib::get_class_name( 'database\rey_data' );

      $aft_data_class_name::substitute_word( $db_word, $this->correct_word );
      $fas_data_class_name::substitute_word( $db_word, $this->correct_word );
      $rey_data_class_name::substitute_word( $db_word, $this->correct_word );
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
    if( is_null( $this->correct_word ) && !is_null( $this->note ) )
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
        $db_test_entry_note->note = $this->note;
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
   * The correct word which may have been provided when marking a word as misspelled
   * @var boolean
   * @access protected
   */
  protected $correct_word = null;

  /**
   * The note to add to test-entries being reassigned as a result of a word being made invalid
   * @var boolean
   * @access protected
   */
  protected $note = null;
}
