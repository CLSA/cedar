<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\test_entry\aft_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // translate word into a new variant and set data record's word_id
    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'word' ) )
    {
      $word_class_name = lib::get_class_name( 'database\word' );
      $word = $post_object->word;
      $db_word = $word_class_name::get_unique_record( array( 'language_id', 'word' ), array( 44, $word ) );
      if( is_null( $db_word ) )
      {
        $db_word = lib::create( 'database\word' );
        $db_word->language_id = 44;
        $db_word->word = $word;
        $db_word->save();
      }

      $this->get_leaf_record()->word_id = $db_word->id;
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    // replace the data with the full record
    $record = $this->get_leaf_record();
    $db_word = $record->get_word();
    $this->set_data( util::json_encode( array (
      'id' => $record->id,
      'word' => $db_word->word,
      'code' => $db_word->get_language()->code,
      'word_type' => $record->get_word_type()
    ) ) );
  }
}
