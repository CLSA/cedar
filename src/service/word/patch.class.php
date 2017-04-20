<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
    if( array_key_exists( 'misspelled', $patch_array ) &&
        true == $patch_array['misspelled'] &&
        array_key_exists( 'correct_word', $patch_array ) )
    {
      $this->correct_word = $patch_array['correct_word'];
      unset( $patch_array['correct_word'] );
    }

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function setup()
  {
    parent::setup();

    $db_word = $this->get_leaf_record();
    if( $db_word->misspelled )
    {
      $db_word->aft = 'invalid';
      $db_word->fas = 'invalid';
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    $db_word = $this->get_leaf_record();

    // add the corrected word if it exists
    if( $db_word->misspelled && !is_null( $this->correct_word ) )
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
    if( $db_word->misspelled && !is_null( $this->correct_word ) )
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
   * The correct word which may have been provided when marking a word as misspelled
   * @var boolean
   * @access protected
   */
  protected $correct_word = null;
}
