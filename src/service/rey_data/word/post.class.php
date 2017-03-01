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
    if( is_null( $post_object ) )
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
    if( is_null( $post_object ) )
    {
      $dictionary_class_name = lib::get_class_name( 'database\dictionary' );
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
        // see if the input is in the misspelled dictionary
        $db_misspelled_dictionary = $dictionary_class_name::get_unique_record( 'name', 'REY_Misspelled' );
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'word', '=', $input_word );
        $modifier->where( 'language_id', '=', $db_language->id );
        if( 0 < $db_misspelled_dictionary->get_word_count( $modifier ) )
        {
          $this->get_status()->set_code( 406 );
        }
        else
        {
          // see if the input already exists as an intrusion
          $db_intrusion_dictionary = $dictionary_class_name::get_unique_record( 'name', 'REY_Intrusion' );
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'word', '=', $input_word );
          $modifier->where( 'language_id', '=', $db_language->id );
          $word_list = $db_intrusion_dictionary->get_word_object_list( $modifier );
          if( 0 < count( $word_list ) )
          {
            $this->db_word = current( $word_list );
          }
          else
          {
            // add the word to the intrusion dictionary and change the post object to its ID
            $this->db_word = lib::create( 'database\word' );
            $this->db_word->dictionary_id = $db_intrusion_dictionary->id;
            $this->db_word->language_id = $db_language->id;
            $this->db_word->word = $input_word;
            $this->db_word->save();
          }
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
      $this->get_parent_record()->add_word( $this->db_word->id );
      $this->status->set_code( 201 );
      $this->set_data( $this->db_word->id );
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
