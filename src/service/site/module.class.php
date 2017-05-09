<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\site;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    if( $select->has_column( 'participant_count', true ) )
    {
      // replace the parent class' join with a special join that restricts by sound-file
      $modifier->remove_join( 'site_join_participant_site' );

      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'participant_site' );
      $join_sel->add_column( 'site_id' );
      $join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join(
        'participant_sound_file_total',
        'participant_site.participant_id',
        'participant_sound_file_total.participant_id'
      );
      $join_mod->where(
        'participant_site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
      $join_mod->group( 'site_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS site_join_participant_site', $join_sel->get_sql(), $join_mod->get_sql() ),
        'site.id',
        'site_join_participant_site.site_id' );
    }
  }
}
