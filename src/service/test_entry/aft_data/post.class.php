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

    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'word' ) )
    {
      // translate word into a new variant and set data record's word_id
      if( !property_exists( $post_object, 'language_id' ) )
      {
        $this->get_status()->set_code( 400 );
      }
      else
      {
        $word_class_name = lib::get_class_name( 'database\word' );
        $word = $post_object->word;
        $language_id = $post_object->language_id;
        $db_word = $word_class_name::get_unique_record(
          array( 'language_id', 'word' ),
          array( $language_id, $word )
        );
        if( is_null( $db_word ) )
        {
          $db_word = lib::create( 'database\word' );
          $db_word->language_id = $language_id;
          $db_word->word = $word;
          $db_word->save();
        }

        if( $db_word->misspelled ) $this->get_status()->set_code( 406 );
        else $this->get_leaf_record()->word_id = $db_word->id;
      }
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
      'rank' => $record->rank,
      'word' => is_null( $db_word ) ? NULL : $db_word->word,
      'code' => is_null( $db_word ) ? NULL : $db_word->get_language()->code,
      'word_type' => is_null( $db_word ) ?
        'placeholder' :
        ( is_null( $db_word->aft ) ? 'variant' : $db_word->aft )
    ) ) );
  }
}
