// extend the framework's module
define( [ cenozoApp.module( 'participant' ).getFileUrl( 'module.js' ) ], function() {
  'use strict';

  var module = cenozoApp.module( 'participant' );

  module.addExtraOperation( 'list', {
    title: 'Update Sound Files',
    isIncluded: function( $state, model ) { return model.listModel.updateSoundFilesAllowed(); },
    operation: function( $state, model ) {
      model.listModel.updateSoundFiles().then( function() {
        model.listModel.onList( true );
      } );
    }
  } );

  // extend the list factory
  cenozo.providers.decorator( 'CnParticipantListFactory', [
    '$delegate', 'CnSession', 'CnHttpFactory', 'CnModalConfirmFactory',
    function( $delegate, CnSession, CnHttpFactory, CnModalConfirmFactory ) { 
      var instance = $delegate.instance;
      $delegate.instance = function( parentModel ) { 
        var object = instance( parentModel );
        object.updateSoundFilesAllowed = function() { return 2 < CnSession.role.tier; };
        object.updateSoundFiles = function() {
          return CnModalConfirmFactory.instance( {
            title: 'Update Sound Files',
            message: 'Are you sure you wish to re-scan for new sound files?\n\n' +
                     'This process is performed automatically every night so it shouldn\'t be necessary to ' +
                     'manually re-scan for new sound files unless you wish to find new recordings made over ' +
                     'the last day.'
          } ).show().then( function( response ) {
            if( response ) return CnHttpFactory.instance( { path: 'sound_file?update=1' } ).count();
          } )
        };
        return object;
      };
      return $delegate;
    }
  ] );
} );
