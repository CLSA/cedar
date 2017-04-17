<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\transcription;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    if( 300 > $this->get_status()->get_code() )
    {
      // special restricts for typists
      $db_transcription = $this->get_resource();
      if( 'typist' == $db_role->name && !is_null( $db_transcription ) &&
          ( $db_user->id != $db_transcription->user_id || !is_null( $db_transcription->end_datetime ) ) )
      {
        $this->get_status()->set_code( 403 );
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_user = $session->get_user();
    $db = $session->get_database();

    if( $select->has_column( 'uid' ) )
    {
      $modifier->join( 'participant', 'transcription.participant_id', 'participant.id' );
      $select->add_column( 'participant.uid', 'uid', false );
    }

    if( $select->has_table_columns( 'user' ) )
      $modifier->left_join( 'user', 'transcription.user_id', 'user.id' );

    // special restricts for typists
    if( 'typist' == $db_role->name )
    {
      $modifier->where( 'transcription.user_id', '=', $db_user->id );
      // don't show in typist list, but allow direct access
      if( is_null( $this->get_resource() ) ) $modifier->where( 'transcription.assigned_count', '>', 0 );
    }

    if( $select->has_column( 'user_list' ) )
    {
      // create a temporary table (for performance reasons) of each transcription's user-list
      $user_list_sel = lib::create( 'database\select' );
      $user_list_sel->from( 'transcription' );
      $user_list_sel->add_column( 'id', 'transcription_id' );
      $user_list_sel->add_column(
        'GROUP_CONCAT( DISTINCT user.name ORDER BY transcription_has_user.datetime )',
        'user_list',
        false
      );

      $user_list_mod = lib::create( 'database\modifier' );
      $user_list_mod->left_join(
        'transcription_has_user', 'transcription.id', 'transcription_has_user.transcription_id' );
      $user_list_mod->left_join( 'user', 'transcription_has_user.user_id', 'user.id' );
      $user_list_mod->group( 'transcription.id' );

      $db->execute( sprintf(
        'CREATE TEMPORARY TABLE transcription_user_list ('.
          'transcription_id INT UNSIGNED NOT NULL, '.
          'user_list VARCHAR(512) DEFAULT NULL, '.
          'INDEX dk_transcription_id( transcription_id ), '.
          'INDEX dk_user_list( user_list ) '.
        ') %s %s',
        $user_list_sel->get_sql(),
        $user_list_mod->get_sql()
      ) );

      $select->add_column( 'transcription_user_list.user_list', 'user_list', false );
      $modifier->join(
        'transcription_user_list', 'transcription.id', 'transcription_user_list.transcription_id' );
    }

    if( $select->has_column( 'language_list' ) )
    {
      // create a temporary table (for performance reasons) of each transcription's language-list
      $language_list_sel = lib::create( 'database\select' );
      $language_list_sel->from( 'transcription' );
      $language_list_sel->add_column( 'id', 'transcription_id' );
      $language_list_sel->add_column(
        'GROUP_CONCAT( DISTINCT language.name ORDER BY language.name )',
        'language_list',
        false
      );

      $language_list_mod = lib::create( 'database\modifier' );
      $language_list_mod->left_join(
        'transcription_has_language', 'transcription.id', 'transcription_has_language.transcription_id' );
      $language_list_mod->left_join( 'language', 'transcription_has_language.language_id', 'language.id' );
      $language_list_mod->group( 'transcription.id' );

      $db->execute( sprintf(
        'CREATE TEMPORARY TABLE transcription_language_list ('.
          'transcription_id INT UNSIGNED NOT NULL, '.
          'language_list VARCHAR(512) DEFAULT NULL, '.
          'INDEX dk_transcription_id( transcription_id ), '.
          'INDEX dk_language_list( language_list ) '.
        ') %s %s',
        $language_list_sel->get_sql(),
        $language_list_mod->get_sql()
      ) );

      $select->add_column( 'transcription_language_list.language_list', 'language_list', false );
      $modifier->join(
        'transcription_language_list', 'transcription.id', 'transcription_language_list.transcription_id' );
    }

    if( $select->has_column( 'state' ) )
    {
      $select->add_column(
        'CONCAT_WS( ", ", '.
          'IF( 0 < assigned_count, "assigned", NULL ), '.
          'IF( 0 < deferred_count, "deferred", NULL ), '.
          'IF( 0 = assigned_count AND 0 = deferred_count, "completed", NULL ) '.
        ')',
        'state',
        false
      );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    $now = util::get_datetime_object();

    if( 'POST' == $this->get_method() )
    {
      $session = lib::create( 'business\session' );
      $record->site_id = $session->get_site()->id;
      $record->start_datetime = $now;
    }
  }
}
