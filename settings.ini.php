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
$SETTINGS['general']['version'] = '2.0.0';
$SETTINGS['general']['build'] = 'afe073c';

// the location of cedar internal path
$SETTINGS['path']['APPLICATION'] = str_replace( '/settings.ini.php', '', __FILE__ );

// always leave as false when running as production server
$SETTINGS['general']['development_mode'] = false;

// the default number of classification test entry inputs
$SETTINGS['interface']['classification_max_rank'] = 40;

// the default number of alpha_numeric test entry inputs
$SETTINGS['interface']['alpha_numeric_max_rank'] = 60;

// the default number hours before an assignment can be deleted
$SETTINGS['interface']['assignment_retention_time'] = 8;

// the root directory where comprehensive recordings are located
// (must be an absolute path that the asterisk server's user has access to)
$SETTINGS['path']['RECORDINGS'] = NULL;
$SETTINGS['url']['RECORDINGS'] = NULL;

// where to store the file which tracks when the last sync was performed
$SETTINGS['general']['last_sync_file'] = $SETTINGS['path']['APPLICATION'].'/last_sync';
