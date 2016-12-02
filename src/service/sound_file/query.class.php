<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\sound_file;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    if( $this->get_argument( 'update', false ) )
    {
      $sound_file_class_name = lib::get_class_name( 'database\sound_file' );
      $sound_file_class_name::update_sound_file_list();
    }
  }
}
