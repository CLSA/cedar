<?php
/**
 * settings.ini.php
 *
 * Defines initialization settings for cedar.
 * DO NOT edit this file, to override these settings use settings.local.ini.php instead.
 * Any changes in the local ini file will override the settings found here.
 */

global $SETTINGS;

// tagged version
$SETTINGS['general']['application_name'] = 'cedar';
$SETTINGS['general']['instance_name'] = $SETTINGS['general']['application_name'];
$SETTINGS['general']['version'] = '2.8';
$SETTINGS['general']['build'] = '195fcaa';

// the location of cedar internal path
$SETTINGS['path']['APPLICATION'] = str_replace( '/settings.ini.php', '', __FILE__ );

// the default number of classification test entry inputs
$SETTINGS['interface']['classification_max_rank'] = 40;

// the default number of alpha_numeric test entry inputs
$SETTINGS['interface']['alpha_numeric_max_rank'] = 60;

// the default number hours before an assignment can be deleted
$SETTINGS['interface']['assignment_retention_time'] = 8;

// the directory where sound files are located
$SETTINGS['path']['RECORDINGS'] = NULL;
$SETTINGS['url']['RECORDINGS'] = NULL;

// where to store the file which tracks when the last sync was performed
$SETTINGS['general']['last_sync_file'] = $SETTINGS['path']['APPLICATION'].'/last_sync';
