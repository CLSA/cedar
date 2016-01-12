<?php
/**
 * error_codes.inc.php
 * 
 * This file is where all error codes are defined.
 * All error code are named after the class and function they occur in.
 */

/**
 * Error number category defines.
 */
define( 'ARGUMENT_CEDAR_BASE_ERRNO',   150000 );
define( 'DATABASE_CEDAR_BASE_ERRNO',   250000 );
define( 'LDAP_CEDAR_BASE_ERRNO',       350000 );
define( 'NOTICE_CEDAR_BASE_ERRNO',     450000 );
define( 'PERMISSION_CEDAR_BASE_ERRNO', 550000 );
define( 'RUNTIME_CEDAR_BASE_ERRNO',    650000 );
define( 'SYSTEM_CEDAR_BASE_ERRNO',     750000 );
define( 'TEMPLATE_CEDAR_BASE_ERRNO',   850000 );

/**
 * "argument" error codes
 */
define( 'ARGUMENT__CEDAR_UI_WIDGET_DICTIONARY_IMPORT__SETUP__ERRNO',
        ARGUMENT_CEDAR_BASE_ERRNO + 1 );

/**
 * "database" error codes
 * 
 * Since database errors already have codes this list is likely to stay empty.
 */

/**
 * "ldap" error codes
 * 
 * Since ldap errors already have codes this list is likely to stay empty.
 */

/**
 * "notice" error codes
 */
define( 'NOTICE__CEDAR_BUSINESS_ASSIGNMENT_MANAGER__RESET_TEST_ENTRY__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 1 );
define( 'NOTICE__CEDAR_DATABASE_ASSIGNMENT__INITIALIZE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 2 );
define( 'NOTICE__CEDAR_DATABASE_RANKED_WORD_SET__GET_WORD__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 3 );
define( 'NOTICE__CEDAR_UI_PULL_DICTIONARY_IMPORT_PROCESS__EXECUTE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 4 );
define( 'NOTICE__CEDAR_UI_PUSH_ASSIGNMENT_DELETE__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 5 );
define( 'NOTICE__CEDAR_UI_PUSH_ASSIGNMENT_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 6 );
define( 'NOTICE__CEDAR_UI_PUSH_ASSIGNMENT_NEW__PREPARE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 7 );
define( 'NOTICE__CEDAR_UI_PUSH_AWAY_TIME_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 8 );
define( 'NOTICE__CEDAR_UI_PUSH_AWAY_TIME_NEW__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 9 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_DELETE__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 10 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_IMPORT_NEW__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 11 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_IMPORT_NEW__EXECUTE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 12 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_IMPORT_PROCESS__EXECUTE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 13 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_NEW__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 14 );
define( 'NOTICE__CEDAR_UI_PUSH_DICTIONARY_TRANSFER_WORD__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 15 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_ALPHA_NUMERIC_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 16 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_CLASSIFICATION_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 17 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_CLASSIFICATION_EDIT__EXECUTE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 18 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_DELETE_LANGUAGE__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 19 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 20 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_NEW_LANGUAGE__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 21 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_RANKED_WORD_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 22 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_RANKED_WORD_EDIT__EXECUTE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 23 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_SUBMIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 24 );
define( 'NOTICE__CEDAR_UI_PUSH_TEST_ENTRY_SUBMIT__FINISH__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 25 );
define( 'NOTICE__CEDAR_UI_PUSH_WORD_EDIT__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 26 );
define( 'NOTICE__CEDAR_UI_PUSH_WORD_NEW__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 27 );
define( 'NOTICE__CEDAR_UI_WIDGET_RANKED_WORD_SET_ADD__SETUP__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 28 );
define( 'NOTICE__CEDAR_UI_WIDGET_RANKED_WORD_SET_VIEW__SETUP__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 29 );
define( 'NOTICE__CEDAR_UI_WIDGET_TEST_ENTRY_TRANSCRIBE__VALIDATE__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 30 );

/**
 * "permission" error codes
 */

/**
 * "runtime" error codes
 */
define( 'RUNTIME__CEDAR_DATABASE_ASSIGNMENT__GET_DEFERRED_COUNT__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 1 );
define( 'RUNTIME__CEDAR_DATABASE_DICTIONARY__GET_OWNER_TEST__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 2 );
define( 'RUNTIME__CEDAR_DATABASE_TEST__GET_WORD_CLASSIFICATION__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 3 );
define( 'RUNTIME__CEDAR_DATABASE_TEST_ENTRY__GET_PREVIOUS__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 4 );
define( 'RUNTIME__CEDAR_DATABASE_TEST_ENTRY__GET_NEXT__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 5 );
define( 'RUNTIME__CEDAR_UI_PUSH_ASSIGNMENT_EDIT__VALIDATE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 6 );
define( 'RUNTIME__CEDAR_UI_PUSH_TEST_ENTRY_RANKED_WORD_DELETE__VALIDATE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 7 );
define( 'RUNTIME__CEDAR_UI_WIDGET_BASE_TRANSCRIBE__PREPARE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 8 );
define( 'RUNTIME__CEDAR_UI_WIDGET_RANKED_WORD_SET_ADD__SETUP__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 9 );
define( 'RUNTIME__CEDAR_UI_WIDGET_TEST_ENTRY_LIST__SETUP__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 10 );
define( 'RUNTIME__CEDAR_UI_WIDGET_TEST_ENTRY_VIEW__PREPARE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 11 );
define( 'RUNTIME__CEDAR_UI_WIDGET_WORD_ADD__SETUP__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 12 );
define( 'RUNTIME__CEDAR_UI_WIDGET_WORD_LIST__PREPARE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 13 );

/**
 * "system" error codes
 * 
 * Since system errors already have codes this list is likely to stay empty.
 * Note the following PHP error codes:
 *      1: error,
 *      2: warning,
 *      4: parse,
 *      8: notice,
 *     16: core error,
 *     32: core warning,
 *     64: compile error,
 *    128: compile warning,
 *    256: user error,
 *    512: user warning,
 *   1024: user notice
 */

/**
 * "template" error codes
 * 
 * Since template errors already have codes this list is likely to stay empty.
 */
