// extend the framework's module
define( [ cenozoApp.module( 'user' ).getFileUrl( 'module.js' ) ], function() {
  'use strict';

  var module = cenozoApp.module( 'user' );

  // extend the view factory
  cenozo.providers.decorator( 'CnUserViewFactory', [
    '$delegate', 'CnSession',
    function( $delegate, CnSession ) {
      var instance = $delegate.instance;
      $delegate.instance = function( parentModel, root ) {
        var object = instance( parentModel, root );

        async function init() {
          // overrride cohort list's onDelete
          await object.deferred.promise;

          if( angular.isDefined( object.cohortModel ) ) {
            object.cohortModel.getChooseEnabled = function() {
              return 3 <= CnSession.role.tier && object.cohortModel.$$getChooseEnabled();
            };
          }
        }

        init();
        return object;
      };
      return $delegate;
    }
  ] );
} );
