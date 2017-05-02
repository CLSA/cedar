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

  if( angular.isDefined( module.actions.crf ) ) {
    module.addExtraOperation( 'list', {
      title: 'CRF',
      operation: function( $state, model ) { $state.go( 'participant.crf' ); }
    } );
  }

  module.addExtraOperation( 'list', {
    title: 'Update Sound Files',
    isIncluded: function( $state, model ) { return model.listModel.canUpdateSoundFiles(); },
    operation: function( $state, model ) {
      model.listModel.updateSoundFiles().then( function( response ) {
        if( angular.isDefined( response ) ) model.listModel.onList( true );
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

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantCrf', [
    'CnParticipantCrfFactory', 'CnSession', '$state', '$timeout',
    function( CnParticipantCrfFactory, CnSession, $state, $timeout ) {
      return {
        templateUrl: cenozoApp.getFileUrl( 'participant', 'crf.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnParticipantCrfFactory.instance();
          $scope.tab = 'participant';
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participants',
              go: function() { $state.go( 'participant.list' ); }
            }, {
              title: 'CRF'
            } ]
          );

          // trigger the elastic directive when confirming the participant selection
          $scope.confirm = function() {
            $scope.model.confirm()
            $timeout( function() { angular.element( '#uidListString' ).trigger( 'change' ) }, 100 );
          };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantCrfFactory', [
    'CnSession', 'CnHttpFactory',
    'CnModalDatetimeFactory', 'CnModalMessageFactory',
    'CnConsentModelFactory', 'CnEventModelFactory', 'CnParticipantModelFactory',
    function( CnSession, CnHttpFactory,
              CnModalDatetimeFactory, CnModalMessageFactory,
              CnConsentModelFactory, CnEventModelFactory, CnParticipantModelFactory ) {
      var object = function() {
        var self = this;
        this.module = module;
        this.confirmInProgress = false;
        this.confirmedCount = null;
        this.uidListString = '';

        this.uidListStringChanged = function() { this.confirmedCount = null; };

        this.confirm = function() {
          this.confirmInProgress = true;
          this.confirmedCount = null;

          // clean up the uid list
          var fixedList =
            this.uidListString.toUpperCase() // convert to uppercase
                        .replace( /[\s,;|\/]/g, ' ' ) // replace whitespace and separation chars with a space
                        .replace( /[^a-zA-Z0-9 ]/g, '' ) // remove anything that isn't a letter, number of space
                        .split( ' ' ) // delimite string by spaces and create array from result
                        .filter( function( uid ) { // match UIDs (eg: A123456)
                          return null != uid.match( /^[A-Z][0-9]{6}$/ );
                        } )
                        .filter( function( uid, index, array ) { // make array unique
                          return index <= array.indexOf( uid );
                        } )
                        .sort(); // sort the array

          // now confirm UID list with server
          if( 0 == fixedList.length ) {
            self.uidListString = '';
            self.confirmInProgress = false;
          } else {
            CnHttpFactory.instance( {
              path: 'participant?crf=1',
              data: { uid_list: fixedList }
            } ).post().then( function( response ) {
              self.confirmedCount = response.data.length;
              self.uidListString = response.data.join( ' ' );
              self.confirmInProgress = false;
            } );
          }
        };

        this.processList = function( type ) {
          // test the formats of all columns
          var uidList = this.uidListString.split( ' ' );

          CnHttpFactory.instance( {
            path: 'participant?crf=1',
            data: { uid_list: uidList, crf: 1 },
            onError: CnModalMessageFactory.httpError
          } ).post().then( function() {
            CnModalMessageFactory.instance( {
              title: 'CRF(s) Processed',
              message: 'A total of ' + uidList.length + ' participant' +
                       ( 1 != uidList.length ? 's have ' : ' has ' ) +
                       'been imported and are ready to be assigned.'
            } ).show().then( function() {
              self.uidListString = '';
            } );
          } );
        };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );
} );
