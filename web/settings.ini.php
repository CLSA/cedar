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
$SETTINGS['general']['service_name'] = $SETTINGS['general']['application_name'];
$SETTINGS['general']['version'] = '1.0.1';

// always leave as false when running as production server
$SETTINGS['general']['development_mode'] = false;

// defines the details used by cedar when communicating with sabretooth
$SETTINGS['sabretooth']['user'] = NULL;
$SETTINGS['sabretooth']['password'] = NULL;
$SETTINGS['sabretooth']['site'] = NULL;
$SETTINGS['sabretooth']['role'] = 'cedar';

// the default number of classification test entry inputs
$SETTINGS['interface']['classification_max_rank'] = 40;

// the url of sabretooth (set to NULL to disable sabretooth support)
$SETTINGS['url']['SABRETOOTH'] = NULL;

// the location of cedar internal path
$SETTINGS['path']['APPLICATION'] = '/usr/local/lib/cedar';
