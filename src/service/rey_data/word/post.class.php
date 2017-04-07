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
  protected function setup()
  {
    parent::setup();

    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'add' ) )
    {
      if( is_array( $post_object->add ) )
      {
        $this->get_status()->set_code( 400 );
      }
      else if( is_object( $post_object->add ) )
      {
        $word_object = $post_object->add;

        // translate word into a new variant and set data record's word_id
        if( !property_exists( $word_object, 'language_id' ) ||
            !property_exists( $word_object, 'word' ) )
        {
          $this->get_status()->set_code( 400 );
        }
        else
        {
          $word_class_name = lib::get_class_name( 'database\word' );
          $rey_data_class_name = lib::get_class_name( 'database\rey_data' );
          $rey_data_variant_class_name = lib::get_class_name( 'database\rey_data_variant' );

          $db_rey_data = $this->get_parent_record();
          $word = $word_object->word;
          $language_id = $word_object->language_id;

          // see if the input is one of the REY words or variants
          $modifier = lib::create( 'database\modifier' );
          $modifier->join( 'word', 'rey_data_variant.word_id', 'variant.id', '', 'variant' );
          $modifier->where( 'rey_data_variant.language_id', '=', $db_rey_data->language_id );
          $modifier->where( 'variant.language_id', '=', $language_id );
          $modifier->where( 'variant.word', '=', $word );
          if( $rey_data_class_name::column_exists( $word ) ||
              0 < $rey_data_variant_class_name::count( $modifier ) )
          {
            $this->get_status()->set_code( 409 );
          }
          else
          {
            // see if the word already exists
            $this->db_word = $word_class_name::get_unique_record(
              array( 'language_id', 'word' ),
              array( $language_id, $word )
            );

            if( !is_null( $this->db_word ) )
            {
              // make sure the word isn't misspelled
              if( $this->db_word->misspelled ) $this->get_status()->set_code( 406 );

              // make sure the word doesn't already exist
              $modifier = lib::create( 'database\modifier' );
              $modifier->where( 'word.id', '=', $this->db_word->id );
              if( 0 < $this->get_parent_record()->get_word_count( $modifier ) )
                $this->get_status()->set_code( 409 );
            }
            else
            {
              // add the word
              $this->db_word = lib::create( 'database\word' );
              $this->db_word->language_id = $language_id;
              $this->db_word->word = $word;
              $this->db_word->save();
            }
          }
        }
      }
      else
      {
        $this->db_word = lib::create( 'database\word', $post_object->add );
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
    }
    else parent::execute();

    $this->set_data( util::json_encode( array (
      'id' => $this->db_word->id,
      'language_id' => $this->db_word->language_id,
      'word' => $this->db_word->word,
      'code' => $this->db_word->get_language()->code,
      'word_type' => is_null( $this->db_word->misspelled ) ? 'variant' : (
        $this->db_word->misspelled ? 'misspelled' : 'intrusion' )
    ) ) );
  }

  /**
   * Stores a word object which may be used in place of the service's file data
   * @var database\word $db_word
   * @access private
   */
  private $db_word = NULL;
}
