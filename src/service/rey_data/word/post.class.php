<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data\word;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    // the status will be 400 since the input is a string (word as text)
    $post_object = $this->get_file_as_object();
    if( is_null( $post_object ) || is_bool( $post_object ) )
    {
      $input_word = $this->get_file_as_raw();
      if( 400 == $this->status->get_code() && is_string( $input_word ) )
        $this->status->set_code( 201 );
    }
  }

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $post_object = $this->get_file_as_object();
    if( is_null( $post_object ) || is_bool( $post_object ) )
    {
      $word_class_name = lib::get_class_name( 'database\word' );
      $rey_data_class_name = lib::get_class_name( 'database\rey_data' );
      $rey_data_variant_class_name = lib::get_class_name( 'database\rey_data_variant' );

      $db_rey_data = $this->get_parent_record();
      $db_language = $db_rey_data->get_language();
      $input_word = strtolower( $this->get_file_as_raw() );

      // see if the input is one of the REY words or variants
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'language_id', '=', $db_language->id );
      $modifier->where( 'variant', '=', $input_word );
      if( $rey_data_class_name::column_exists( $input_word ) ||
          0 < $rey_data_variant_class_name::count( $modifier ) )
      {
        $this->get_status()->set_code( 409 );
      }
      else
      {
        // see if the word already exists
        $this->db_word = $word_class_name::get_unique_record(
          array( 'language_id', 'word' ),
          array( $db_language->id, $input_word )
        );

        if( !is_null( $this->db_word ) )
        {
          if( $this->db_word->misspelled ) $this->get_status()->set_code( 406 );
        }
        else
        {
          // add the word
          $this->db_word = lib::create( 'database\word' );
          $this->db_word->language_id = $db_language->id;
          $this->db_word->word = $input_word;
          $this->db_word->save();
        }
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    if( !is_null( $this->db_word ) )
    {
      // manually insert the word to the rey_data
      $db_rey_data = $this->get_parent_record();
      $db_rey_data->add_word( $this->db_word->id );
      $this->status->set_code( 201 );
      $this->set_data( util::json_encode( array (
        'id' => $this->db_word->id,
        'word' => $this->db_word->word,
        'code' => $this->db_word->get_language()->code,
        'word_type' => $db_rey_data->get_word_type( $this->db_word )
      ) ) );
    }
    else parent::execute();
  }

  /**
   * Stores a word object which may be used in place of the service's file data
   * @var database\word $db_word
   * @access private
   */
  private $db_word = NULL;
}
