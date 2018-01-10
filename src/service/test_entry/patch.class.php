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
  }
}
