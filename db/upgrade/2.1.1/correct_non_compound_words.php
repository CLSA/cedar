#!/usr/bin/php
<?php
/**
 * This is a special script used when upgrading to version 2.1.1
 * This script should be run once after running load_word_associations.php
 * It replaces all "s"-"word" with "s'word" in FAS test entries
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

    out( 'Getting French language primary key' );
    $result = $this->db->query( sprintf(
      'SELECT id FROM %s.language WHERE code = "fr"', 
      $this->settings['db']['database_prefix'].$this->settings['general']['framework_name']
    ) );
    if( false === $result )
    {
      error( $this->db->error );
      die();
    }
    foreach( $result as $row ) $language_id = $row['id'];

    out( 'Getting temporary "a" marker word primary key' );
    $result = $this->db->query( sprintf(
      'SELECT id FROM word WHERE language_id = %s AND word = "a"', 
      $language_id
    ) );
    if( false === $result )
    {
      error( $this->db->error );
      die();
    }
    foreach( $result as $row ) $marker_word_id = $row['id'];

    out( 'Updating s-compound words' );
    $result = $this->db->query(
      'INSERT INTO word( language_id, word, misspelled, fas ) VALUES'."\n".
      '( '.$language_id.', "s\'abandonner", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'abattre", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'abreuver", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'abriter", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'abroger", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'abstenir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accabler", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accaparer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accorger", false, "intrusion" ),'."\n".
      '( '.$language_id.', "s\'accoter", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accoutumer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accrocher", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'accroupir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'adonner", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'affairer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'affirmer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'affoler", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'affranchir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'agacer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'agenouiller", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'agrandir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'aimer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'allonger", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'alourdir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'amouracher", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'amourracher", NULL, NULL ),'."\n".
      '( '.$language_id.', "s\'amuser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'animer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'appauvrir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'appliquer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'apprivoiser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'approcher", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'approprier", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'armer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'arrêter", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'asseoir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'assombrir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'assoupir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'aventurer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'avertir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'effacer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'effondrer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'endormir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'enliser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'entasser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'envoie", NULL, NULL ),'."\n".
      '( '.$language_id.', "s\'envoler", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'excuser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'exiler", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'ébahir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'élancer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'élargir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'élever", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'émerveiller", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'énerver", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'épauler", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'éteindre", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'étendre", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'éterniser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'étirer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'étourdir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'éveiller", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'habituer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'imaginer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'immiscer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'immobiliser", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'initier", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'inquieter", NULL, NULL ),'."\n".
      '( '.$language_id.', "s\'installer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'intimer", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'objecter", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'obstiner", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'occuper", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'offre", NULL, NULL ),'."\n".
      '( '.$language_id.', "s\'ouvrir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'unir", false, "primary" ),'."\n".
      '( '.$language_id.', "s\'use", NULL, NULL )'."\n".
      'ON DUPLICATE KEY UPDATE misspelled = VALUES( misspelled ), fas = VALUES( fas )'
    );
    if( false === $result )
    {
      error( $this->db->error );
      die();
    }

    out( 'Adding additional compound words' );
    $result = $this->db->query( sprintf(
      'INSERT INTO compound( word_id, sub_word_id, rank )'."\n".
      'SELECT word.id, sub_word.id, 1'."\n".
      'FROM word, word AS sub_word'."\n".
      'WHERE word.language_id = %s'."\n".
      'AND sub_word.language_id = %s'."\n".
      'AND ('."\n".
      '  ('."\n".
      '    word.word IN ( "s\'abroger","s\'accabler","s\'entasser","s\'épauler","s\'intimer" )'."\n".
      '    AND sub_word.word = "si"'."\n".
      '  ) OR ('."\n".
      '    word.word IN ( "s\'accaparer","s\'accrocher","s\'agacer","s\'avertir","s\'immobiliser","s\'objecter" )'."\n".
      '    AND sub_word.word = "se"'."\n".
      '  )'."\n".
      ')'."\n".
      'UNION'."\n".
      'SELECT word.id, sub_word.id, 2'."\n".
      'FROM word, word AS sub_word'."\n".
      'WHERE word.language_id = %s'."\n".
      'AND sub_word.language_id = %s'."\n".
      'AND ('."\n".
      '  ( word.word = "s\'abroger" AND sub_word.word = "abroger" ) OR'."\n".
      '  ( word.word = "s\'accabler" AND sub_word.word = "accabler" ) OR'."\n".
      '  ( word.word = "s\'entasser" AND sub_word.word = "entasser" ) OR'."\n".
      '  ( word.word = "s\'épauler" AND sub_word.word = "épauler" ) OR'."\n".
      '  ( word.word = "s\'intimer" AND sub_word.word = "intimer" ) OR'."\n".
      '  ( word.word = "s\'accaparer" AND sub_word.word = "accaparer" ) OR'."\n".
      '  ( word.word = "s\'accrocher" AND sub_word.word = "accrocher" ) OR'."\n".
      '  ( word.word = "s\'agacer" AND sub_word.word = "agacer" ) OR'."\n".
      '  ( word.word = "s\'avertir" AND sub_word.word = "avertir" ) OR'."\n".
      '  ( word.word = "s\'immobiliser" AND sub_word.word = "immobiliser" ) OR'."\n".
      '  ( word.word = "s\'objecter" AND sub_word.word = "objecter" )'."\n".
      ')',
      $language_id,
      $language_id,
      $language_id,
      $language_id
    ) );
    if( false === $result )
    {
      error( $this->db->error );
      die();
    }

    out( 'Replacing "s"-"word" pairs with "s\'word" and a temporary marker-word' );
    $result = $this->db->query( sprintf(
      'UPDATE fas_data as fasa'."\n".
      'JOIN fas_data AS fasb on fasa.test_entry_id = fasb.test_entry_id'."\n".
      '                     and fasa.rank = fasb.rank-1'."\n".
      'JOIN word AS worda ON fasa.word_id = worda.id'."\n".
      'JOIN word AS wordb ON fasb.word_id = wordb.id'."\n".
      'JOIN word AS wordc ON CONCAT( "s\'", wordb.word ) = wordc.word'."\n".
      'SET fasa.word_id = wordc.id, fasb.word_id = %s'."\n".
      'WHERE worda.language_id = %s'."\n".
      '  AND wordb.language_id = %s'."\n".
      '  AND wordc.language_id = %s'."\n".
      '  AND worda.word = "s"'."\n".
      '  AND SUBSTRING( wordb.word, 1, 1 ) != "s"',
      $marker_word_id,
      $language_id,
      $language_id,
      $language_id
    ) );
    if( false === $result )
    {
      error( $this->db->error );
      die();
    }

    out( 'Removing marker words and decrementing ranks of remaining FAS word entries' );
    $result = $this->db->query( sprintf(
      'SELECT fas_data.id,'."\n".
             'GROUP_CONCAT( fas_data_remainder.id ORDER BY fas_data_remainder.rank ) remainder_ids'."\n".
      'FROM fas_data'."\n".
      'LEFT JOIN fas_data AS fas_data_remainder ON fas_data.test_entry_id = fas_data_remainder.test_entry_id'."\n".
                                       'AND fas_data.rank < fas_data_remainder.rank'."\n".
      'WHERE fas_data.word_id = %s'."\n".
      'GROUP BY fas_data.id'."\n".
      'ORDER BY fas_data.test_entry_id, fas_data.rank',
      $marker_word_id
    ) );
    if( false === $result )
    {
      error( $this->db->error );
      break;
    }

    $total = 0;
    foreach( $result as $row )
    {
      $result = $this->db->query( sprintf(
        'DELETE FROM fas_data WHERE id = %s',
        $row['id']
      ) );
      if( false === $result )
      {
        error( $this->db->error );
        break;
      }

      if( !is_null( $row['remainder_ids'] ) )
      {
        $result = $this->db->query( sprintf(
          'UPDATE fas_data '."\n".
          'SET rank = rank - 1'."\n".
          'WHERE id IN ( %s )'."\n".
          'ORDER BY rank',
          $row['remainder_ids']
        ) );
        if( false === $result )
        {
          error( $this->db->error );
          break;
        }
      }

      $total++;
    }

    out( sprintf( 'Done, %s entries corrected', $total ) );
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
