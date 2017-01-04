<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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

          // the participant's default language must be spoken by the typist
          if( 0 < $db_user->get_language_count() )
          {
            $participant_mod->join(
              'user_has_language', 'participant.language_id', 'user_has_language.language_id' );
            $participant_mod->where( 'user_has_language.user_id', '=', $db_user->id );
          }

          // order by sound file datetime so we get older recordings first
          $participant_mod->order( 'participant_sound_file_total.datetime' );
          
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

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_site = $session->get_site();
    $db_transcription = $this->get_leaf_record();

    // set the user and participant based on what was determined in the validate method
    $db_transcription->user_id = $db_user->id;
    $db_transcription->participant_id = $this->participant_id;
    $db_transcription->site_id = $db_site->id;
    $db_transcription->start_datetime = util::get_datetime_object();
  }

  /**
   * TODO: document
   */
  protected $participant_id = NULL;
}
