<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // reset the test when changing its language
    $data = $this->get_file_as_array();
    if( array_key_exists( 'language_id', $data ) )
    {
      $db_test_entry = $this->get_leaf_record()->get_test_entry();

      // if the test-entry only has the wrong language associated with it, switch it
      $select = lib::create( 'database\select' );
      $select->add_column( 'id' );
      $language_list = array();
      foreach( $db_test_entry->get_language_list( $select ) as $row ) $language_list[] = $row['id'];
      if( !is_array( $data['language_id'], $language_list ) )
      {
        // replace if only 1 language is in the list, otherwise add
        if( 1 == count( $language_list ) ) $db_test_entry->replace_language( $data['language_id'] );
        else $db_test_entry->add_language( $data['language_id'] );
      }

      // reset the test-entry
      $db_test_entry->reset();
    }
  }
}
