#!/usr/bin/php
<?php
/**
 * This script will create multiple CSV files containing export data which can be imported to Opal.
 * It should only be ran once after all transcriptions have been completed.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

ini_set( 'display_errors', '1' );
error_reporting( E_ALL | E_STRICT );
ini_set( 'date.timezone', 'US/Eastern' );

// utility functions
function out( $msg ) { printf( '%s: %s'."\n", date( 'Y-m-d H:i:s' ), $msg ); }
function error( $msg, $line ) { out( sprintf( "Error on line %s:\n%s\n", $line, $msg ) ); }

// used to convert raw strings to CSV format
function to_csv( $value ) {
  return sprintf(
    '"%s"',
    str_replace(
      array( '"', "\n" ),
      array( '""', '\\n' ),
      $value
    )
  );
}

class export
{
  /**
   * Reads the framework and application settings
   */
  public function read_settings()
  {
    // include the initialization settings
    global $SETTINGS;
    require_once '../settings.ini.php';
    require_once '../settings.local.ini.php';
    require_once $SETTINGS['path']['CENOZO'].'/src/initial.class.php';
    $initial = new \cenozo\initial();
    $this->settings = $initial->get_settings();
    $this->cenozo_database_name = $this->settings['db']['database_prefix'].$this->settings['general']['framework_name'];
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
      error( $this->db->connect_error, __LINE__ );
      die();
    }
    $this->db->set_charset( 'utf8' );

    // determine the study phase
    $result = $this->db->query( sprintf(
      'SELECT study_phase.code '.
      'FROM %s.application '.
      'JOIN %s.study_phase ON application.study_phase_id = study_phase.id '.
      'WHERE application.name = "%s"',
      $this->cenozo_database_name,
      $this->cenozo_database_name,
      $this->settings['general']['instance_name']
    ) );

    if( false === $result )
    {
      error( $this->db->error, __LINE__ );
      die();
    }

    $values = $result->fetch_array( MYSQLI_NUM );
    $result->free();
    $this->study_phase = current( $values );
  }

  /**
   * Converts a database result array to CSV format
   */
  public function convert_to_csv( $array )
  {
    $output = '';
    $first = true;
    foreach( $array as $row )
    {
      if( $first )
      {
        $output = implode( ',', array_map( 'to_csv', array_keys( $row ) ) )."\n";
        $first = false;
      }

      $output .= implode( ',', array_map( 'to_csv', $row ) )."\n";
    }

    return $output;
  }

  /**
   * Executes the export
   */
  public function execute()
  {
    out( 'Reading configuration parameters' );
    $this->read_settings();

    out( 'Connecting to database' );
    $this->connect_database();

    $cohort_list = array(
      array( 'name' => 'comprehensive', 'code' => 'CO', 'suffix' => strtoupper( 'CO'.$this->study_phase ) ),
      array( 'name' => 'tracking', 'code' => 'TR', 'suffix' => strtoupper( 'TR'.$this->study_phase ) )
    );

    $test_type_list = array(
      array( 'name' => 'F-Word Fluency (FAS-F)', 'code' => 'FAS_F', 'type' => 'fas' ),
      array( 'name' => 'A-Word Fluency (FAS-A)', 'code' => 'FAS_A', 'type' => 'fas' ),
      array( 'name' => 'S-Word Fluency (FAS-S)', 'code' => 'FAS_S', 'type' => 'fas' ),
      array( 'name' => 'Animal Fluency (AFT)', 'code' => 'AFT', 'type' => 'aft' ),
      array( 'name' => 'Immediate Word List (REY1)', 'code' => 'REYI', 'type' => 'rey' ),
      array( 'name' => 'Delayed Word List (REY2)', 'code' => 'REYII', 'type' => 'rey' ),
      array( 'name' => 'Mental Alternation (MAT)', 'code' => 'MAT', 'type' => 'mat' ),
    );

    foreach( $cohort_list as $cohort )
    {
      ///////////////////////////////////////////////////////////////////////////////////////////////
      foreach( $test_type_list as $test_type )
      {
        // tracking doesn't have the FAS test
        if( 'tracking' == $cohort['name'] && 'fas' == $test_type['type'] ) continue;

        $filename = sprintf( '%s_meta.%s%s.csv', $test_type['code'], $cohort['code'], strtoupper( $this->study_phase ) );
        out( sprintf( 'Generating %s', $filename ) );

        $result = $this->db->query( sprintf(
          'SELECT uid AS entity_id, '.
                 'IFNULL( note, 9 ) AS COG_%s_META_NOTES_%s, '.
                 'IFNULL( audio_status_type.name, 9 ) AS COG_%s_META_AUDIO_STATUS_%s, '.
                 'IFNULL( participant_status_type.name, 9 ) AS COG_%s_META_PSTATUS_%s '.
          'FROM transcription '.
          'JOIN %s.participant ON transcription.participant_id = participant.id '.
          'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
          'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
          'JOIN test_type ON test_entry.test_type_id = test_type.id '.
          'LEFT JOIN test_entry_note ON test_entry.id = test_entry_note.test_entry_id '.
          'LEFT JOIN status_type AS audio_status_type '.
                 'ON test_entry.audio_status_type_id = audio_status_type.id '.
          'LEFT JOIN status_type AS participant_status_type '.
                 'ON test_entry.participant_status_type_id = participant_status_type.id '.
          'LEFT JOIN status_type AS admin_status_type '.
                 'ON test_entry.admin_status_type_id = admin_status_type.id '.
          'WHERE cohort.name = "%s" '.
          'AND test_type.name = "%s" '.
          'ORDER BY uid',
          $test_type['code'],
          $cohort['suffix'],
          $test_type['code'],
          $cohort['suffix'],
          $test_type['code'],
          $cohort['suffix'],
          $this->cenozo_database_name,
          $this->cenozo_database_name,
          $cohort['name'],
          $test_type['name']
        ) );

        if( false === $result )
        {
          error( $this->db->error, __LINE__ );
          die();
        }

        $rows = array();
        while( $row = $result->fetch_assoc() )
        {
          // convert audio_status codes
          $c = sprintf( 'COG_%s_META_AUDIO_STATUS_%s', $test_type['code'], $cohort['suffix'] );
          if( is_null( $row[$c] ) ) $row[$c] = 9;
          else if( 'unavailable' == $row[$c] ) $row[$c] = 1;
          else if( 'unusable' == $row[$c] ) $row[$c] = 2;
          else if( 'salvable' == $row[$c] ) $row[$c] = 3;
          else if( 'crf' == $row[$c] ) $row[$c] = 4;

          // convert participant status codes
          $c = sprintf( 'COG_%s_META_PSTATUS_%s', $test_type['code'], $cohort['suffix'] );
          if( is_null( $row[$c] ) ) $row[$c] = 9;
          else if( 'refused' == $row[$c] ) $row[$c] = 1;
          else if( 'suspected prompt' == $row[$c] ) $row[$c] = 2;
          else if( 'prompted' == $row[$c] ) $row[$c] = 3;
          else if( 'prompt middle' == $row[$c] ) $row[$c] = 4;
          else if( 'prompt end' == $row[$c] ) $row[$c] = 5;

          $rows[$row['entity_id']] = $row;
        }
        $result->free();

        // we need to add counting/alphabet to the MAT test entries
        if( 'mat' == $test_type['type'] )
        {
          $result = $this->db->query( sprintf(
            'SELECT uid AS entity_id, '.
                   'audio_status_type.name AS audio_status, '.
                   'participant_status_type.name AS participant_status, '.
                   'counting, '.
                   'alphabet '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN premat_data ON test_entry.id = premat_data.test_entry_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'LEFT JOIN test_entry_note ON test_entry.id = test_entry_note.test_entry_id '.
            'LEFT JOIN status_type AS audio_status_type '.
                   'ON test_entry.audio_status_type_id = audio_status_type.id '.
            'LEFT JOIN status_type AS participant_status_type '.
                   'ON test_entry.participant_status_type_id = participant_status_type.id '.
            'LEFT JOIN status_type AS admin_status_type '.
                   'ON test_entry.admin_status_type_id = admin_status_type.id '.
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "Pre Mental Alternation (pre-MAT)" '.
            'ORDER BY uid',
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $cohort['name']
          ) );

          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          while( $row = $result->fetch_assoc() )
          {
            if( 'refused' == $row['participant_status'] ) $counting = 9;
            else if( 'unavailable' == $row['audio_status'] ) $counting = 3;
            else if( 'unusable' == $row['audio_status'] ) $counting = 4;
            else $counting = $row['counting'] ? 1 : 2;
            $c = sprintf( 'COG_CNTMETA_%s', $cohort['suffix'] );
            $rows[$row['entity_id']][$c] = $counting;

            if( 'refused' == $row['participant_status'] ) $alphabet = 9;
            else if( 'unavailable' == $row['audio_status'] ) $alphabet = 3;
            else if( 'unusable' == $row['audio_status'] ) $alphabet = 4;
            else $alphabet = $row['alphabet'] ? 1 : 2;
            $c = sprintf( 'COG_ALPMETA_%s', $cohort['suffix'] );
            $rows[$row['entity_id']][$c] = $alphabet;
          }
          $result->free();
        }

        file_put_contents( $filename, $this->convert_to_csv( $rows ) );

        ///////////////////////////////////////////////////////////////////////////////////////////////
        $filename = sprintf( '%s_scores.%s%s.csv', $test_type['code'], $cohort['code'], strtoupper( $this->study_phase ) );
        out( sprintf( 'Generating %s', $filename ) );

        // first get the base data
        $result = $this->db->query( sprintf(
          'SELECT uid AS entity_id, '.
                 'score AS COG_%s_SCORE_1_%s'.(
            'aft' == $test_type['type'] ?
            sprintf( ', alt_score AS COG_%s_SCORE_2_%s ', $test_type['code'], $cohort['suffix'] ) :
            ' '
          ).
          'FROM transcription '.
          'JOIN %s.participant ON transcription.participant_id = participant.id '.
          'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
          'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
          'JOIN test_type ON test_entry.test_type_id = test_type.id '.
          'WHERE cohort.name = "%s" '.
          'AND test_type.name = "%s" '.
          'ORDER BY uid',
          $test_type['code'],
          $cohort['suffix'],
          $this->cenozo_database_name,
          $this->cenozo_database_name,
          $cohort['name'],
          $test_type['name']
        ) );

        if( false === $result )
        {
          error( $this->db->error, __LINE__ );
          die();
        }

        $array = array();
        while( $row = $result->fetch_assoc() ) $array[$row['entity_id']] = $row;
        $result->free();

        if( 'rey' == $test_type['type'] )
        {
          // get all of the base REY words and variants
          $result = $this->db->query( sprintf(
            'SELECT uid AS entity_id, '.
                   'IFNULL( drum.word, IF( "en" = language.code, "drum", "tambour" ) ) AS COG_%s_1_%s, '.
                   'IF( drum.word IS NOT NULL, 2, IF( drum, 1, 9 ) ) AS COG_%s_1_CAT_%s, '.
                   'language.code AS COG_%s_1_LANG_%s, '.
                   'IFNULL( curtain.word, IF( "en" = language.code, "curtain", "rideau" ) ) AS COG_%s_2_%s, '.
                   'IF( curtain.word IS NOT NULL, 2, IF( curtain, 1, 9 ) ) AS COG_%s_2_CAT_%s, '.
                   'language.code AS COG_%s_2_LANG_%s, '.
                   'IFNULL( bell.word, IF( "en" = language.code, "bell", "cloche" ) ) AS COG_%s_3_%s, '.
                   'IF( bell.word IS NOT NULL, 2, IF( bell, 1, 9 ) ) AS COG_%s_3_CAT_%s, '.
                   'language.code AS COG_%s_3_LANG_%s, '.
                   'IFNULL( coffee.word, IF( "en" = language.code, "coffee", "café" ) ) AS COG_%s_4_%s, '.
                   'IF( coffee.word IS NOT NULL, 2, IF( coffee, 1, 9 ) ) AS COG_%s_4_CAT_%s, '.
                   'language.code AS COG_%s_4_LANG_%s, '.
                   'IFNULL( school.word, IF( "en" = language.code, "school", "école" ) ) AS COG_%s_5_%s, '.
                   'IF( school.word IS NOT NULL, 2, IF( school, 1, 9 ) ) AS COG_%s_5_CAT_%s, '.
                   'language.code AS COG_%s_5_LANG_%s, '.
                   'IFNULL( parent.word, IF( "en" = language.code, "parent", "parent" ) ) AS COG_%s_6_%s, '.
                   'IF( parent.word IS NOT NULL, 2, IF( parent, 1, 9 ) ) AS COG_%s_6_CAT_%s, '.
                   'language.code AS COG_%s_6_LANG_%s, '.
                   'IFNULL( moon.word, IF( "en" = language.code, "moon", "lune" ) ) AS COG_%s_7_%s, '.
                   'IF( moon.word IS NOT NULL, 2, IF( moon, 1, 9 ) ) AS COG_%s_7_CAT_%s, '.
                   'language.code AS COG_%s_7_LANG_%s, '.
                   'IFNULL( garden.word, IF( "en" = language.code, "garden", "jardin" ) ) AS COG_%s_8_%s, '.
                   'IF( garden.word IS NOT NULL, 2, IF( garden, 1, 9 ) ) AS COG_%s_8_CAT_%s, '.
                   'language.code AS COG_%s_8_LANG_%s, '.
                   'IFNULL( hat.word, IF( "en" = language.code, "hat", "chapeau" ) ) AS COG_%s_9_%s, '.
                   'IF( hat.word IS NOT NULL, 2, IF( hat, 1, 9 ) ) AS COG_%s_9_CAT_%s, '.
                   'language.code AS COG_%s_9_LANG_%s, '.
                   'IFNULL( farmer.word, IF( "en" = language.code, "farmer", "fermier" ) ) AS COG_%s_10_%s, '.
                   'IF( farmer.word IS NOT NULL, 2, IF( farmer, 1, 9 ) ) AS COG_%s_10_CAT_%s, '.
                   'language.code AS COG_%s_10_LANG_%s, '.
                   'IFNULL( nose.word, IF( "en" = language.code, "nose", "nez" ) ) AS COG_%s_11_%s, '.
                   'IF( nose.word IS NOT NULL, 2, IF( nose, 1, 9 ) ) AS COG_%s_11_CAT_%s, '.
                   'language.code AS COG_%s_11_LANG_%s, '.
                   'IFNULL( turkey.word, IF( "en" = language.code, "turkey", "dinde" ) ) AS COG_%s_12_%s, '.
                   'IF( turkey.word IS NOT NULL, 2, IF( turkey, 1, 9 ) ) AS COG_%s_12_CAT_%s, '.
                   'language.code AS COG_%s_12_LANG_%s, '.
                   'IFNULL( colour.word, IF( "en" = language.code, "colour", "couleur" ) ) AS COG_%s_13_%s, '.
                   'IF( colour.word IS NOT NULL, 2, IF( colour, 1, 9 ) ) AS COG_%s_13_CAT_%s, '.
                   'language.code AS COG_%s_13_LANG_%s, '.
                   'IFNULL( house.word, IF( "en" = language.code, "house", "maison" ) ) AS COG_%s_14_%s, '.
                   'IF( house.word IS NOT NULL, 2, IF( house, 1, 9 ) ) AS COG_%s_14_CAT_%s, '.
                   'language.code AS COG_%s_14_LANG_%s, '.
                   'IFNULL( river.word, IF( "en" = language.code, "river", "rivière" ) ) AS COG_%s_15_%s, '.
                   'IF( river.word IS NOT NULL, 2, IF( river, 1, 9 ) ) AS COG_%s_15_CAT_%s, '.
                   'language.code AS COG_%s_15_LANG_%s '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'JOIN rey_data ON test_entry.id = rey_data.test_entry_id '.
            'JOIN %s.language ON rey_data.language_id = language.id '.
            'LEFT JOIN word AS drum ON rey_data.drum_rey_data_variant_id = drum.id '.
            'LEFT JOIN word AS curtain ON rey_data.curtain_rey_data_variant_id = curtain.id '.
            'LEFT JOIN word AS bell ON rey_data.bell_rey_data_variant_id = bell.id '.
            'LEFT JOIN word AS coffee ON rey_data.coffee_rey_data_variant_id = coffee.id '.
            'LEFT JOIN word AS school ON rey_data.school_rey_data_variant_id = school.id '.
            'LEFT JOIN word AS parent ON rey_data.parent_rey_data_variant_id = parent.id '.
            'LEFT JOIN word AS moon ON rey_data.moon_rey_data_variant_id = moon.id '.
            'LEFT JOIN word AS garden ON rey_data.garden_rey_data_variant_id = garden.id '.
            'LEFT JOIN word AS hat ON rey_data.hat_rey_data_variant_id = hat.id '.
            'LEFT JOIN word AS farmer ON rey_data.farmer_rey_data_variant_id = farmer.id '.
            'LEFT JOIN word AS nose ON rey_data.nose_rey_data_variant_id = nose.id '.
            'LEFT JOIN word AS turkey ON rey_data.turkey_rey_data_variant_id = turkey.id '.
            'LEFT JOIN word AS colour ON rey_data.colour_rey_data_variant_id = colour.id '.
            'LEFT JOIN word AS house ON rey_data.house_rey_data_variant_id = house.id '.
            'LEFT JOIN word AS river ON rey_data.river_rey_data_variant_id = river.id '.
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "%s" '.
            'GROUP BY transcription.id '.
            'ORDER BY uid',
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'], $test_type['code'], $cohort['suffix'],
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $cohort['name'],
            $test_type['name']
          ) );
          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          while( $row = $result->fetch_assoc() ) $array[$row['entity_id']] = array_merge( $array[$row['entity_id']], $row );
          $result->free();

          // determine the maximum number of intrudtions provided by a single rey test entry
          $result = $this->db->query( sprintf(
            'SELECT COUNT(*) '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id = cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'JOIN rey_data ON test_entry.id = rey_data.test_entry_id '.
            'JOIN rey_data_has_word ON rey_data.id = rey_data_has_word.rey_data_id '.
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "%s" '.
            'GROUP BY rey_data_id '.
            'ORDER BY COUNT(*) DESC '.
            'LIMIT 1',
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $cohort['name'],
            $test_type['name']
          ) );

          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          $values = $result->fetch_array( MYSQLI_NUM );
          $result->free();
          $max_number = current( $values );

          // add column headers for all numbers
          foreach( $array as $index => $row )
          {
            for( $number = 1; $number <= $max_number; $number++ )
            {
              $array[$index][sprintf( 'COG_%s_%d_%s', $test_type['code'], $number+15, $cohort['suffix'] )] = '';
              $array[$index][sprintf( 'COG_%s_%d_CAT_%s', $test_type['code'], $number+15, $cohort['suffix'] )] = '';
              $array[$index][sprintf( 'COG_%s_%d_LANG_%s', $test_type['code'], $number+15, $cohort['suffix'] )] = '';
            }
          }

          // now set the intrusion data
          $result = $this->db->query( sprintf(
            'SELECT uid AS entity_id, '.
                   'IFNULL( cword.word, word.word ) AS word, '.
                   'language.code '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'JOIN rey_data ON test_entry.id = rey_data.test_entry_id '.
            'JOIN rey_data_has_word ON rey_data.id = rey_data_has_word.rey_data_id '.
            'JOIN word ON rey_data_has_word.word_id = word.id '.
            'JOIN %s.language ON word.language_id = language.id '.
            'LEFT JOIN compound ON word.id = compound.word_id '.
            'LEFT JOIN word AS cword ON compound.sub_word_id = cword.id '.
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "%s" '.
            'ORDER BY uid, compound.rank',
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $cohort['name'],
            $test_type['name']
          ) );
          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          $number = 16;
          $last_entity_id = NULL;
          while( $row = $result->fetch_assoc() )
          {
            if( $last_entity_id != $row['entity_id'] ) $number = 16;

            // set the word
            $c = sprintf( 'COG_%s_%d_%s', $test_type['code'], $number, $cohort['suffix'] );
            $array[$row['entity_id']][$c] = $row['word'];

            // set the word's category
            $c = sprintf( 'COG_%s_%d_CAT_%s', $test_type['code'], $number, $cohort['suffix'] );
            $array[$row['entity_id']][$c] = 3; // always an intrusion (3)

            // set the word's language
            $c = sprintf( 'COG_%s_%d_LANG_%s', $test_type['code'], $number, $cohort['suffix'] );
            $array[$row['entity_id']][$c] = $row['code'];

            $number++;
            $last_entity_id = $row['entity_id'];
          }
          $result->free();
        }
        else
        {
          // determine the maximum number of words provided by a single test entry
          $result = $this->db->query( sprintf(
            'SELECT MAX( data_table.rank ) '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id = cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'JOIN %s_data AS data_table ON test_entry.id = data_table.test_entry_id '.
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "%s"',
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $test_type['type'],
            $cohort['name'],
            $test_type['name']
          ) );

          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          $values = $result->fetch_array( MYSQLI_NUM );
          $result->free();
          $max_number = current( $values );

          // add column headers for all numbers
          foreach( $array as $index => $row )
          {
            for( $number = 1; $number <= $max_number; $number++ )
            {
              $array[$index][sprintf( 'COG_%s_%d_%s', $test_type['code'], $number, $cohort['suffix'] )] = '';
              if( 'MAT' != $test_type['code'] )
                $array[$index][sprintf( 'COG_%s_%d_CAT_%s', $test_type['code'], $number, $cohort['suffix'] )] = '';
              $array[$index][sprintf( 'COG_%s_%d_LANG_%s', $test_type['code'], $number, $cohort['suffix'] )] = '';
            }
          }

          // now fill in the word data
          $result = $this->db->query( sprintf(
            'SELECT uid AS entity_id, '.(
              'mat' == $test_type['type'] ?
              'value AS word, ' :
              sprintf(
                'IFNULL( cword.word, word.word ) AS word, IFNULL( cword.%s, word.%s ) AS type, ',
                $test_type['type'],
                $test_type['type']
              )
            ).'language.code '.
            'FROM transcription '.
            'JOIN %s.participant ON transcription.participant_id = participant.id '.
            'JOIN %s.cohort ON participant.cohort_id= cohort.id '.
            'JOIN test_entry ON transcription.id = test_entry.transcription_id '.
            'JOIN test_type ON test_entry.test_type_id = test_type.id '.
            'JOIN %s_data AS data_table ON test_entry.id = data_table.test_entry_id '.(
              'mat' == $test_type['type'] ?
              'JOIN test_entry_has_language ON test_entry.id = test_entry_has_language.test_entry_id '.
              'JOIN %s.language ON test_entry_has_language.language_id = language.id ' :
              'JOIN word ON data_table.word_id = word.id '.
              'JOIN %s.language ON word.language_id = language.id '.
              'LEFT JOIN compound ON word.id = compound.word_id '.
              'LEFT JOIN word AS cword ON compound.sub_word_id = cword.id '
            ).
            'WHERE cohort.name = "%s" '.
            'AND test_type.name = "%s" '.
            'ORDER BY uid, data_table.rank'.( 'mat' == $test_type['type'] ? '' : ', compound.rank' ),
            $this->cenozo_database_name,
            $this->cenozo_database_name,
            $test_type['type'],
            $this->cenozo_database_name,
            $cohort['name'],
            $test_type['name']
          ) );
          if( false === $result )
          {
            error( $this->db->error, __LINE__ );
            die();
          }

          $number = 1;
          $last_entity_id = NULL;
          while( $row = $result->fetch_assoc() )
          {
            if( $last_entity_id != $row['entity_id'] ) $number = 1;

            // set the word
            $c = sprintf( 'COG_%s_%d_%s', $test_type['code'], $number, $cohort['suffix'] );
            $array[$row['entity_id']][$c] = $row['word'];

            // set the word's category
            if( 'mat' != $test_type['type'] )
            {
              $c = sprintf( 'COG_%s_%d_CAT_%s', $test_type['code'], $number, $cohort['suffix'] );
              if( 'primary' == $row['type'] ) $array[$row['entity_id']][$c] = 1;
              else if( is_null( $row['type'] ) ) $array[$row['entity_id']][$c] = 2;
              else if( 'intrusion' == $row['type'] ) $array[$row['entity_id']][$c] = 3;
              else if( 'invalid' == $row['type'] ) $array[$row['entity_id']][$c] = 4;
            }

            // set the word's language
            $c = sprintf( 'COG_%s_%d_LANG_%s', $test_type['code'], $number, $cohort['suffix'] );
            $array[$row['entity_id']][$c] = $row['code'];

            $number++;
            $last_entity_id = $row['entity_id'];
          }
          $result->free();
        }

        file_put_contents( $filename, $this->convert_to_csv( $array ) );
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

$export = new export();
$export->execute();
