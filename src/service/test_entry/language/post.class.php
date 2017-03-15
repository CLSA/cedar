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

    // do not allow a test-entry to have no languages
    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'remove' ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'language.id', 'NOT IN', $post_object->remove );
      if( 0 == $this->get_parent_record()->get_language_count( $modifier ) )
        $this->get_status()->set_code( 409 );
    }
  }
}
