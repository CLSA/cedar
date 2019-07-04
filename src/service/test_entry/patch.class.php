<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\test_entry;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all patch services
 */
class patch extends \cenozo\service\patch
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    try
    {
      parent::setup();
    }
    catch( \cenozo\exception\runtime $e )
    {
      if( RUNTIME__CEDAR_DATABASE_TEST_ENTRY____SET__ERRNO == $e->get_number() )
        $this->status->set_code( 409 );
      else throw $e;
    }
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // make a note that the test entry has been opened (this will only happen for typists)
    if( $this->get_argument( 'close', false ) ) $this->get_leaf_record()->close_activity();

    // make a note that the test entry has been opened (this will only happen for typists)
    if( $this->get_argument( 'reset', false ) ) $this->get_leaf_record()->reset();

    // when submitting a test entry remove any unused languages
    $patch_array = $this->get_file_as_array();
    if( array_key_exists( 'state', $patch_array ) && 'submitted' == $patch_array['state'] )
    {
      $db_test_entry = $this->get_leaf_record();
      $data_table_name = $db_test_entry->get_data_table_name();
      if( 'aft_data' == $data_table_name || 'fas_data' == $data_table_name ) {
        $modifier = lib::create( 'database\modifier' );
        $modifier->join( 'word', $data_table_name.'.word_id', 'word.id' );
        $select = lib::create( 'database\select' );
        $select->add_table_column( 'word', 'language_id' );
        $select->set_distinct( true );

        $method_name = sprintf( 'get_%s_list', $data_table_name );
        $word_language_list = array();
        foreach( $db_test_entry->$method_name( $select, $modifier ) as $row ) $word_language_list[] = $row['language_id'];

        // do nothing if the test has no words
        if( 0 < count( $word_language_list ) )
        {
          $select = lib::create( 'database\select' );
          $select->add_table_column( 'language', 'id' );
          $test_entry_language_list = array();
          foreach( $db_test_entry->get_language_list( $select ) as $row ) $test_entry_language_list[] = $row['id'];

          // remove all languages which are in the test entry but not in the word list
          $remove_language_list = array_diff( $test_entry_language_list, $word_language_list );
          if( 0 < count( $remove_language_list ) ) $db_test_entry->remove_language( $remove_language_list );
        }
      }
    }
  }
}
