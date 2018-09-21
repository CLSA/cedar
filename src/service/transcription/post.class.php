<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\transcription;
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

    if( 300 > $this->status->get_code() )
    {
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $session = lib::create( 'business\session' );
      $db_user = $session->get_user();
      $db_role = $session->get_role();
      $db_site = $session->get_site();
      $file = $this->get_file_as_array();

      if( array_key_exists( 'uid_list', $file ) )
      {
        // only tier-3 roles can process uid-lists
        if( 3 > $db_role->tier ) $this->status->set_code( 403 );

        // make sure the import restriction is valid
        $import_restriction = array_key_exists( 'import_restriction', $file )
                            ? $file['import_restriction']
                            : 'no-import';
        if( !in_array( $import_restriction, array( 'no-import', 'import', 'any' ) ) )
          $this->status->set_code( 400 );
      }
      else
      {
        // only typists can create transcriptions directly
        if( 'typist' != $db_role->name )
        {
          $this->status->set_code( 403 );
        }
        else
        {
          $max_transcriptions = $db_site->get_setting()->max_working_transcriptions;

          // make sure the typist is allowed to create a new transcription
          $transcription_mod = lib::create( 'database\modifier' );
          $transcription_mod->where( 'end_datetime', '=', NULL );
          $transcription_mod->where( 'assigned_count', '>', 0 );
          if( $max_transcriptions <= $db_user->get_transcription_count( $transcription_mod ) )
          {
            $this->set_data( sprintf(
              'You cannot begin a new transcription because you may not have more than %d working '.
              'transcriptions at a time.',
              $max_transcriptions
            ) );
            $this->status->set_code( 409 );
          }
          else // make sure there is a participant available for a new transcription
          {
            // the participant has to have sound files
            $participant_sel = lib::create( 'database\select' );
            $participant_sel->add_column( 'id' );
            $participant_mod = lib::create( 'database\modifier' );
            $participant_mod->join(
              'participant_sound_file_total',
              'participant.id',
              'participant_sound_file_total.participant_id'
            );

            // the participant belongs to a cohort that the user had access to
            $participant_mod->join(
              'user_has_cohort',
              'participant.cohort_id',
              'user_has_cohort.cohort_id'
            );
            $participant_mod->where( 'user_has_cohort.user_id', '=', $db_user->id );

            // the participant's default language must be spoken by the typist
            if( 0 < $db_user->get_language_count() )
            {
              $participant_mod->join(
                'user_has_language', 'participant.language_id', 'user_has_language.language_id' );
              $participant_mod->where( 'user_has_language.user_id', '=', $db_user->id );
            }

            // order by sound file datetime so we get newer recordings first
            $participant_mod->order_desc( 'participant_sound_file_total.datetime' );

            // join to the transcription table to make sure the participant doesn't have an existing transcription
            $participant_mod->left_join( 'transcription', 'participant.id', 'transcription.participant_id' );
            $participant_mod->where( 'transcription.id', '=', NULL );

            $participant_list = $participant_class_name::select( $participant_sel, $participant_mod );

            if( 0 == count( $participant_list ) )
            {
              $this->set_data(
                'There are no participants available for a transcription at this time, please try again later.' );
              $this->status->set_code( 408 );
            }
            else
            {
              $participant = current( $participant_list );
              $this->participant_id = $participant['id'];
            }
          }
        }
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_site = $session->get_site();
    $file = $this->get_file_as_array();

    if( !array_key_exists( 'uid_list', $file ) )
    {
      $db_transcription = $this->get_leaf_record();

      // set the user and participant based on what was determined in the validate method
      $db_transcription->user_id = $db_user->id;
      $db_transcription->participant_id = $this->participant_id;
      $db_transcription->site_id = $db_site->id;
      $db_transcription->start_datetime = util::get_datetime_object();
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $sound_file_class_name = lib::get_class_name( 'database\sound_file' );
    $transcription_class_name = lib::get_class_name( 'database\transcription' );
    $file = $this->get_file_as_array();

    if( array_key_exists( 'uid_list', $file ) )
    {
      $modifier = lib::create( 'database\modifier' );

      $import_restriction = array_key_exists( 'import_restriction', $file )
                          ? $file['import_restriction']
                          : 'no-import';
      $site_id = array_key_exists( 'site_id', $file ) ? $file['site_id'] : NULL;
      $user_id = array_key_exists( 'user_id', $file ) ? $file['user_id'] : NULL;
      $process = array_key_exists( 'process', $file ) && $file['process'];

      // restrict the UID list based on the import restriction parameter
      if( 'import' == $import_restriction )
      {
        // restrict to participants who do not have a sound file count
        $modifier->left_join(
          'participant_sound_file_total', 'participant.id', 'participant_sound_file_total.participant_id' );
        $modifier->where( 'participant_sound_file_total.total', '=', NULL );
      }
      else
      {
        // do not include participants whose transcription is complete
        // note that participants with no transcriptions will not be restricted by this modification
        $modifier->left_join( 'transcription', 'participant.id', 'transcription.participant_id' );
        $modifier->where( 'transcription.end_datetime', '=', NULL );
      }

      if( 'no-import' == $import_restriction )
      {
        // restrict to participants who have a sound file count
        $modifier->join(
          'participant_sound_file_total', 'participant.id', 'participant_sound_file_total.participant_id' );
      }

      $uid_list = $participant_class_name::get_valid_uid_list( $file['uid_list'], $modifier );

      if( $process )
      {
        // first import any new participants
        if( 'no-import' != $import_restriction )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'uid', 'IN', $uid_list );
          $sound_file_class_name::force_add_participant_list( $modifier );
        }

        // assign transcriptions to the user if requested
        if( !is_null( $site_id ) && !is_null( $user_id ) )
        {
          $participant_sel = lib::create( 'database\select' );
          $participant_sel->from( 'participant' );
          $participant_sel->add_column( 'id' );
          $participant_mod = lib::create( 'database\modifier' );
          $participant_mod->where( 'uid', 'IN', $uid_list );
          foreach( $participant_class_name::select( $participant_sel, $participant_mod ) as $participant )
          {
            $db_transcription =
              $transcription_class_name::get_unique_record( 'participant_id', $participant['id'] );
            if( is_null( $db_transcription ) )
            {
              $db_transcription = lib::create( 'database\transcription' );
              $db_transcription->participant_id = $participant['id'];
              $db_transcription->start_datetime = util::get_datetime_object();
            }

            $db_transcription->site_id = $site_id;
            $db_transcription->user_id = $user_id;
            $db_transcription->save();
          }
        }
      }
      else
      {
        $this->set_data( $uid_list );
      }
    }
    else parent::execute();
  }

  /**
   * A caching variable
   * @var integer
   */
  protected $participant_id = NULL;
}
