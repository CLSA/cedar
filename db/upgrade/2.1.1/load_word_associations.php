#!/usr/bin/php
<?php
/**
 * This is a special script used when upgrading to version 2.1.1
 * This script should be run once after running patch_database.sql
 * It creates all compound word associations.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

ini_set( 'display_errors', '1' );
error_reporting( E_ALL | E_STRICT );
ini_set( 'date.timezone', 'US/Eastern' );

// utility functions
function out( $msg ) { printf( '%s: %s'."\n", date( 'Y-m-d H:i:s' ), $msg ); }
function error( $msg ) { out( sprintf( 'ERROR! %s', $msg ) ); }


class patch
{
  /**
   * Reads the framework and application settings
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function read_settings()
  {
    // include the initialization settings
    global $SETTINGS;
    require_once '../../../settings.ini.php';
    require_once '../../../settings.local.ini.php';
    require_once $SETTINGS['path']['CENOZO'].'/src/initial.class.php';
    $initial = new \cenozo\initial();
    $this->settings = $initial->get_settings();
  }

  public function connect_database()
  {
    $server = $this->settings['db']['server'];
    $username = $this->settings['db']['username'];
    $password = $this->settings['db']['password'];
    $name = $this->settings['db']['database_prefix'] . $this->settings['general']['instance_name'];
    $this->db = new \mysqli( $server, $username, $password, $name );
    if( $this->db->connect_error )
    {
      error( $this->db->connect_error );
      die();
    }
    $this->db->set_charset( 'utf8' );
  }

  /**
   * Executes the patch
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function execute()
  {
    out( 'Reading configuration parameters' );
    $this->read_settings();

    out( 'Connecting to database' );
    $this->connect_database();

    out( 'Getting language primary keys' );
    $result = $this->db->query( sprintf(
      'SELECT id,code FROM %s.language', 
      $this->settings['db']['database_prefix'].$this->settings['general']['framework_name']
    ) );
    if( false === $result )
    {
      error( $this->db_error );
      die();
    }

    $language_list = array();
    foreach( $result as $row ) $language_list[$row['code']] = $row['id'];

    out( 'Creating compound associations' );
    if( false === $this->db->query( 'TRUNCATE compound' ) ) error( $this->db->error );
    else
    {
      $line = 1;
      try
      {
        $last_compound_word = NULL;
        $rank = 1;
        foreach( file( 'compound_list.csv' ) as $string )
        {
          $error = false;
          $parts = explode( ',', str_replace( "\n", '', $string ) );
          if( !( 3 == count( $parts ) || 5 == count( $parts ) ) ) throw new Exception;

          // make sure all words are enclosed by quotes
          $language_code = array_shift( $parts ); // remove the language
          if( !preg_match( '/^"[^"]+"$/', $language_code ) ) throw new Exception;
          $language_id = $language_list[substr( $language_code, 1, -1 )];
          $compound_word = array_shift( $parts ); // remove the compound word
          if( !preg_match( '/^"[^"]+"$/', $compound_word ) ) throw new Exception;
          $sub_word = array_shift( $parts ); // remove the sub-word
          if( !preg_match( '/^"[^"]+"$/', $sub_word ) ) throw new Exception;

          if( $last_compound_word != $compound_word )
          {
            $rank = 1;
            $last_compound_word = $compound_word;
          }

          if( 0 < count( $parts ) )
          {
            $test_type = array_shift( $parts );
            if( !preg_match( '/^"[^"]+"$/', $test_type ) ) throw new Exception;
            $test_type_value = array_shift( $parts );
            if( !preg_match( '/^"[^"]+"$/', $test_type_value ) ) throw new Exception;

            // if there are more arguments left then this is likely a new word
            $sql = sprintf(
              'INSERT IGNORE INTO word'."\n".
              'SET language_id = %d,'."\n".
              '    word = %s,'."\n".
              '    aft = %s,'."\n".
              '    fas = %s,'."\n".
              '    description = "Added while importing compound word data."',
              $language_id,
              $sub_word,
              '"aft"' == $test_type ? $test_type_value : 'NULL',
              '"fas"' == $test_type ? $test_type_value : 'NULL'
            );

            if( false === $this->db->query( $sql ) )
            {
              error( $this->db->error );
              break;
            }
          }

          $sql = sprintf(
            'INSERT INTO compound( word_id, sub_word_id, rank )'."\n".
            'SELECT compound_word.id, sub_word.id, %d'."\n".
            'FROM word AS compound_word, word AS sub_word'."\n".
            'WHERE compound_word.language_id = %d'."\n".
            'AND compound_word.language_id = sub_word.language_id'."\n".
            'AND compound_word.word = %s'."\n".
            'AND sub_word.word = %s;'."\n",
            $rank,
            $language_id,
            $compound_word,
            $sub_word
          );

          if( false === $this->db->query( $sql ) )
          {
            error( $this->db->error );
            break;
          }

          $rank++;
          $line++;
        }

        out( 'Mark all base words as spelled correctly' );
        $sql = sprintf(
          'UPDATE compound'."\n".
          'JOIN word ON compound.word_id = word.id'."\n".
          'SET word.misspelled = 0'
        );
        if( false === $this->db->query( $sql ) ) error( $this->db->error );

        out( 'Mark all compound words as spelled correctly' );
        $sql = sprintf(
          'UPDATE compound'."\n".
          'JOIN word ON compound.sub_word_id = word.id'."\n".
          'SET word.misspelled = 0'
        );
        if( false === $this->db->query( $sql ) ) error( $this->db->error );

        out( 'Change all base word FAS values based on their compound words' );
        $sql = sprintf(
          'UPDATE word'."\n".
          'JOIN compound ON word.id = compound.word_id'."\n".
          'JOIN word cword ON compound.sub_word_id = cword.id'."\n".
          'SET word.fas = "primary"'."\n".
          'WHERE cword.fas = "primary"'
        );
        if( false === $this->db->query( $sql ) ) error( $this->db->error );

        out( 'Change all base word AFT values based on their compound words' );
        $sql = sprintf(
          'UPDATE word'."\n".
          'JOIN compound ON word.id = compound.word_id'."\n".
          'JOIN word cword ON compound.sub_word_id = cword.id'."\n".
          'SET word.aft = "primary"'."\n".
          'WHERE cword.aft = "primary"'
        );
        if( false === $this->db->query( $sql ) ) error( $this->db->error );
      }
      catch( Exception $e )
      {
        error('Error while parsing line '.$line );
      }
    }

    out( 'Done' );
  }

  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings = array();
}

$patch = new patch();
$patch->execute();
