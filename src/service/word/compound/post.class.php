<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\word\compound;
use cenozo\lib, cenozo\log, cedar\util;

class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $db_word = $this->get_parent_record();
      if( !is_null( $db_word->animal_code ) ) $this->get_status()->set_code( 400 );
    }
  }
}
