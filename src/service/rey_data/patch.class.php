<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\rey_data;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  public function get_file_as_array()
  {
    // remove language_id from the patch array
    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'language_id', $patch_array ) )
    {
      $this->language_id = $patch_array['language_id'];
      $this->update_language = true;
      unset( $patch_array['language_id'] );
    }

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // process the preferred site, if it exists
    if( $this->update_language ) $this->set_language();
  }

  /**
   * TODO: document
   */
  protected function set_language()
  {
    $this->get_leaf_record()->get_test_entry()->replace_language( $this->language_id );
  }

  /**
   * Whether to update the rey_data's preferred site
   * @var boolean
   * @access protected
   */
  protected $update_language = false;

  /**
   * What to change the rey_data's preferred site to
   * @var int
   * @access protected
   */
  protected $language_id;
}
