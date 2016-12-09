<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\participant\transcription;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $test_type_class_name = lib::get_class_name( 'database\test_type' );
    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );
    $db_transcription = $this->get_leaf_record();

    // create a test-entry and test-data for each test-type
    $test_type_sel = lib::create( 'database\select' );
    $test_type_sel->add_column( 'id' );
    $test_type_mod = lib::create( 'database\modifier' );
    $test_type_mod->order( 'rank' );
    foreach( $test_type_class_name::select( $test_type_sel, $test_type_mod ) as $test_type )
    {
      $db_test_entry = lib::create( 'database\test_entry' );
      $db_test_entry->transcription_id = $db_transcription->id;
      $db_test_entry->test_type_id = $test_type['id'];
      $db_test_entry->save();
      $db_test_entry->get_data(); // this will create the test data for this entry
    }
  }
}
