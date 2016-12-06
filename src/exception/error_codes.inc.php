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
define( 'VOIP_CEDAR_BASE_ERRNO',       950000 );

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
define( 'NOTICE__CEDAR_BUSINESS_ASSIGNMENT_MANAGER__RESET_TEST_ENTRY__ERRNO',
        NOTICE_CEDAR_BASE_ERRNO + 1 );

/**
 * "permission" error codes
 */

/**
 * "runtime" error codes
 */
define( 'RUNTIME__CEDAR_BUSINESS_ASSIGNMENT_MANAGER__RETURN_TEST_ENTRY__ERRNO',
        RUNTIME_CEDAR_BASE_ERRNO + 1 );

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

