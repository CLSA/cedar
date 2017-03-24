// extend the framework's module
define( [ cenozoApp.module( 'participant' ).getFileUrl( 'module.js' ) ], function() {
  'use strict';

  var module = cenozoApp.module( 'participant' );

  // add the participant's transcription details as a hidden variable
  module.addInput( '', 'transcription_id', {
    column: 'transcription.id',
    type: 'hidden'
  } );

  // remove unneeded columns
  delete module.columnList.active;
  delete module.columnList.source;
  delete module.columnList.state;
  delete module.columnList.global_note;

  // add transcription details to the column list
  angular.extend( module.columnList, {
    state: { title: 'State' },
    start_datetime: {
      column: 'transcription.start_datetime',
      title: 'Start',
      type: 'datetime'
    },
    end_datetime: {
      column: 'transcription.end_datetime',
      title: 'End',
      type: 'datetime'
    }
  } )

  module.addExtraOperation( 'list', {
    title: 'Update Sound Files',
    isIncluded: function( $state, model ) { return model.listModel.canUpdateSoundFiles(); },
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

        // define custom functions
        object.canUpdateSoundFiles = function() { return 2 < CnSession.role.tier; };
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

  // extend the view factory
  cenozo.providers.decorator( 'CnParticipantViewFactory', [
    '$delegate',
    function( $delegate ) {
      var instance = $delegate.instance;
      $delegate.instance = function( parentModel, root ) {
        var object = instance( parentModel, root );

        // extend onView
        object.afterView( function() {
          if( angular.isDefined( object.transcriptionModel ) ) {
            object.transcriptionModel.getAddEnabled = function() {
              return angular.isDefined( object.transcriptionModel.module.actions.add ) &&
                     null == object.record.transcription_id;
            };
          }
        } );

        // overrride transcription list's onDelete
        object.deferred.promise.then( function() {
          if( angular.isDefined( object.transcriptionModel ) ) {
            object.transcriptionModel.listModel.onDelete = function( record ) {
              return object.transcriptionModel.listModel.$$onDelete( record ).then( function() {
                object.onView();
              } );
            };
          }
        } );
        return object;
      };
      return $delegate;
    }
  ] );
} );
