<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\test_entry\language;
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

    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'remove' ) )
    {
      $db_test_entry = $this->get_parent_record();

      // do not allow a test-entry to have no languages
      if( !property_exists( $post_object, 'add' ) )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'language.id', 'NOT IN', $post_object->remove );
        if( 0 == $db_test_entry->get_language_count( $modifier ) ) $this->get_status()->set_code( 409 );
      }

      // do not allow languages which are used in the data to be removed
      $data_table_name = $db_test_entry->get_data_table_name();
      if( 'aft_data' == $data_table_name || 'fas_data' == $data_table_name ) {
        $modifier = lib::create( 'database\modifier' );
        $modifier->join( 'word', $data_table_name.'.word_id', 'word.id' );
        $modifier->where( 'word.language_id', 'IN', $post_object->remove );
        $method_name = sprintf( 'get_%s_count', $data_table_name );
        if( 0 < $db_test_entry->$method_name( $modifier ) ) $this->get_status()->set_code( 409 );
      } else if( 'rey_data' == $data_table_name ) {
        $rey_data_class_name = lib::get_class_name( 'database\rey_data' );
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'word.language_id', 'IN', $post_object->remove );
        $db_rey_data = $rey_data_class_name::get_unique_record( 'test_entry_id', $db_test_entry->id );
        if( 0 < $db_rey_data->get_word_count( $modifier ) ) $this->get_status()->set_code( 409 );
      }
    }
  }
}
