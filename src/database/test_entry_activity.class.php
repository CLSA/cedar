<?php
/**
 * test_entry_activity.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry_activity: record
 */
class test_entry_activity extends \cenozo\database\record
{
  /**
   * Closes lapsed activity
   * 
   * @param database\user $db_user Focus on a particular user
   */
  public static function close_lapsed( $db_user = NULL )
  {
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

    $affected_rows = 0;
    if( is_null( $db_user ) )
    {
      // find all activity about to be closed
      $modifier = $activity_class_name::get_expired_modifier();
      $modifier->join( 'activity', 'test_entry_activity.user_id', 'activity.user_id' );
      $modifier->join( 'role', 'activity.role_id', 'role.id' );
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'activity.user_id', '=', 'access.user_id', false );
      $join_mod->where( 'activity.role_id', '=', 'access.role_id', false );
      $join_mod->where( 'activity.site_id', '=', 'access.site_id', false );
      $modifier->join_modifier( 'access', $join_mod );
      $modifier->where( 'activity.application_id', '=', $db_application->id );
      $modifier->where( 'activity.end_datetime', '=', NULL );
      $modifier->where( 'test_entry_activity.end_datetime', '=', NULL );
      $modifier->where( 'role.name', '=', 'typist' );

      $affected_rows = static::db()->execute( sprintf(
        'UPDATE test_entry_activity %s'."\n".
        'SET test_entry_activity.end_datetime = datetime'."\n".
        'WHERE %s',
        $modifier->get_join(),
        $modifier->get_where()
      ) );
    }
    else
    {
      // find all activity about to be closed by this user
      $modifier = lib::create( 'database\modifier' );
      $modifier->join( 'activity', 'test_entry_activity.user_id', 'activity.user_id' );
      $modifier->join( 'role', 'activity.role_id', 'role.id' );
      $modifier->where( 'activity.application_id', '=', $db_application->id );
      $modifier->where( 'activity.end_datetime', '=', NULL );
      $modifier->where( 'test_entry_activity.end_datetime', '=', NULL );
      $modifier->where( 'test_entry_activity.user_id', '=', $db_user->id );
      $modifier->where( 'role.name', '=', 'typist' );

      $affected_rows = static::db()->execute( sprintf(
        'UPDATE test_entry_activity %s'."\n".
        'SET test_entry_activity.end_datetime = UTC_TIMESTAMP()'."\n".
        'WHERE %s',
        $modifier->get_join(),
        $modifier->get_where()
      ) );
    }

    return $affected_rows;
  }
}
