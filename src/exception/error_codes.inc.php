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
define( 'ARGUMENT_CEDAR_BASE_ERRNO',   170000 );
define( 'DATABASE_CEDAR_BASE_ERRNO',   270000 );
define( 'LDAP_CEDAR_BASE_ERRNO',       370000 );
define( 'NOTICE_CEDAR_BASE_ERRNO',     470000 );
define( 'PERMISSION_CEDAR_BASE_ERRNO', 570000 );
define( 'RUNTIME_CEDAR_BASE_ERRNO',    670000 );
define( 'SYSTEM_CEDAR_BASE_ERRNO',     770000 );
define( 'VOIP_CEDAR_BASE_ERRNO',       970000 );

/**
 * "argument" error codes
 */

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

/**
 * "permission" error codes
 */

/**
 * "runtime" error codes
 */
define( 'RUNTIME__CEDAR_DATABASE_TEST_ENTRY__GET_DATA_TABLE_NAME__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 1 );
define( 'RUNTIME__CEDAR_DATABASE_TRANSCRIPTION__SAVE__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 2 );

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
 * "voip" error codes
 */

