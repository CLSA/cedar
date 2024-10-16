<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_entry;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
abstract class base_rank_data_post extends \cenozo\service\post
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
          try
          {
            $db_word = lib::create( 'database\word' );
            $db_word->language_id = $language_id;
            $db_word->word = $word;
            $db_word->save();
          }
          catch( \cenozo\exception\argument $e )
          {
            $this->get_status()->set_code( 409 );
          }
        }

        if( $this->may_continue() )
        {
          $data_type = str_replace( '_data', '', $this->get_leaf_subject() );
          if( $db_word->misspelled ) $this->get_status()->set_code( 406 );
          else if( 'invalid' == $db_word->$data_type ) $this->get_status()->set_code( 409 );
          else $this->get_leaf_record()->word_id = $db_word->id;
        }
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $data_type = str_replace( '_data', '', $this->get_leaf_subject() );

    // replace the data with the full record
    $record = $this->get_leaf_record();
    $db_test_type = $record->get_test_entry()->get_test_type();
    $db_word = $record->get_word();
    $this->set_data( array(
      'id' => $record->id,
      'rank' => $record->rank,
      'word' => is_null( $db_word ) ? NULL : $db_word->word,
      'code' => is_null( $db_word ) ? NULL : $db_word->get_language()->code,
      'word_type' => is_null( $db_word ) ?
        'placeholder' : (
          is_null( $db_word->$data_type ) ? 'variant' : (
            'aft' == $data_type ? $db_word->$data_type : $db_word->get_fas( $db_test_type )
          )
        )
    ) );
  }
}
