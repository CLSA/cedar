define( [ 'aft_data', 'fas_data', 'mat_data', 'premat_data', 'rey_data' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_entry', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'transcription',
        column: 'transcription.uid'
      }
    },
    name: {
      singular: 'test entry',
      plural: 'test entries',
      possessive: 'test entry\'s',
      pluralPossessive: 'test entries\'',
      friendlyColumn: 'test_type_name'
    },
    columnList: {
      test_type_name: {
        column: 'test_type.name',
        title: 'Type'
      },
      user_list: {
        title: 'User List',
        isIncluded: function( $state, model ) { return !model.isTypist; },
        help: 'Which users have worked with the test-entry, ordered by first access date'
      },
      language_list: {
        title: 'Language List',
        help: 'Which languages the test entry has been associated with'
      },
      state: {
        title: 'State',
        type: 'string'
      }
    },
    defaultOrder: {
      column: 'test_type.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    test_type_name: { column: 'test_type.name', type: 'hidden' },
    data_type: { column: 'test_type.data_type', type: 'hidden' },
    audio_status: { type: 'enum' },
    participant_status: { type: 'enum' },
    state: { type: 'enum' },
    prev_test_entry_id: { type: 'hidden' },
    next_test_entry_id: { type: 'hidden' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryList', [
    'CnTestEntryModelFactory',
    function( CnTestEntryModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryNotes', [
    'CnTestEntryNotesFactory', '$timeout',
    function( CnTestEntryNotesFactory, $timeout) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'notes.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryNotesFactory.instance();

          // trigger the elastic directive when adding a note or undoing
          $scope.addNote = function() {
            $scope.model.addNote();
            $timeout( function() { angular.element( '#newNote' ).trigger( 'change' ) }, 100 );
          };

          $scope.undo = function( id ) {
            $scope.model.undo( id );
            $timeout( function() { angular.element( '#note' + id ).trigger( 'change' ) }, 100 );
          };

          $scope.refresh = function() { $scope.model.onView(); };
          $scope.model.onView();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryView', [
    'CnTestEntryModelFactory', 'CnModalConfirmFactory',
    function( CnTestEntryModelFactory, CnModalConfirmFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;

          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          angular.extend( $scope, {
            refresh: function() {
              if( $scope.isComplete ) {
                $scope.isComplete = false;
                var type = $scope.model.viewModel.record.data_type.toLowerCase() + 'DataModel';

                // update the data record
                $scope.model.viewModel[type].viewModel.onView();

                // update the test entry record
                $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true } );
              }
            },
            reset: function() {
              if( $scope.isComplete ) {
                CnModalConfirmFactory.instance( {
                  title: 'Reset Entry?',
                  message: 'Are you sure you wish to reset the entry?'
                } ).show().then( function( response ) {
                  if( response ) $scope.model.viewModel.reset().then( function() { $scope.refresh(); } );
                } );
              }
            }
          } );
        },
        link: function( scope, element ) {
          // close the test entry activity
          scope.$on( '$stateChangeStart', function() { scope.model.viewModel.close(); } );

          scope.model.metadata.getPromise().then( function() {
            var audioStatus = scope.model.metadata.columnList.audio_status;
            scope.audioStatusList = angular.copy( audioStatus.enumList );
            if( !audioStatus.required ) scope.audioStatusList.unshift( { value: '', name: '(empty)' } );
            var participantStatus = scope.model.metadata.columnList.participant_status;
            scope.participantStatusList = angular.copy( participantStatus.enumList );
            if( !participantStatus.required ) scope.participantStatusList.unshift( { value: '', name: '(empty)' } );
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryViewFactory', [
    'CnBaseViewFactory',
    'CnAftDataModelFactory', 'CnFasDataModelFactory', 'CnMatDataModelFactory',
    'CnPrematDataModelFactory', 'CnReyDataModelFactory',
    'CnSession', 'CnHttpFactory', 'CnModalTextFactory', '$state', '$q',
    function( CnBaseViewFactory,
              CnAftDataModelFactory, CnFasDataModelFactory, CnMatDataModelFactory,
              CnPrematDataModelFactory, CnReyDataModelFactory,
              CnSession, CnHttpFactory, CnModalTextFactory, $state, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        function defer() {
          self.isWorking = true;
          return CnHttpFactory.instance( {
            path: self.parentModel.getServiceResourcePath(),
            data: { state: 'deferred' }
          } ).patch().then( function() {
            self.record.state = 'deferred';
            self.isWorking = false;
            if( self.parentModel.isTypist ) return self.next();
          } );
        }

        angular.extend( this, {
          onViewPromise: null,
          soundFileList: [],

          // add the test entry's data models
          aftDataModel: CnAftDataModelFactory.instance( parentModel ),
          fasDataModel: CnFasDataModelFactory.instance( parentModel ),
          matDataModel: CnMatDataModelFactory.instance( parentModel ),
          prematDataModel: CnPrematDataModelFactory.instance( parentModel ),
          reyDataModel: CnReyDataModelFactory.instance( parentModel ),
          isWorking: false,
          noteCount: 0,

          onView: function() {
            // get the number of notes
            CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '/test_entry_note'
            } ).count().then( function( response ) {
              self.noteCount = response.headers( 'Total' );
            } );

            this.onViewPromise = this.$$onView().then( function() {
              self.parentModel.getStatusEditEnabled = function() {
                return self.parentModel.$$getEditEnabled() &&
                       ( !self.parentModel.isTypist || 'assigned' == self.record.state );
              };

              self.parentModel.getEditEnabled = function() {
                return self.parentModel.$$getEditEnabled() && (
                         !self.parentModel.isTypist || (
                           'assigned' == self.record.state &&
                           'unusable' != self.record.audio_status &&
                           'unavailable' != self.record.audio_status &&
                           'refused' != self.record.participant_status
                         )
                       );
              };

              self.languageModel.getChooseEnabled = function() {
                return self.languageModel.$$getChooseEnabled() &&
                       self.parentModel.$$getEditEnabled() && (
                         !self.parentModel.isTypest || (
                           'assigned' == self.record.state &&
                           'unusable' != self.record.audio_status &&
                           'unavailable' != self.record.audio_status &&
                           'refused' != self.record.participant_status
                         )
                       );
              };

              // get the sound file list for this test-entry
              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '/sound_file',
                data: { select: { column: [ 'id', 'name', 'url' ] } }
              } ).query().then( function( response ) {
                self.soundFileList = response.data;
              } );
            } );
            return self.onViewPromise;
          },
          patchStatus: function( type ) {
            // Patching status is special since it can be done under some circumstances where the test-entry
            // is not editable
            if( self.parentModel.getStatusEditEnabled() ) {
              var property = type + '_status';
              var data = {};
              data[property] = '' == self.record[property] ? null : self.record[property];
              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: data
              } ).patch();
            }
          },
          submit: function() {
            self.isWorking = true;
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath(),
              data: { state: 'submitted' }
            } ).patch().then( function() {
              self.record.state = 'submitted';
              self.isWorking = false;
              if( self.parentModel.isTypist ) return self.next();
            } );
          },
          defer: function() {
            // force a new message if the last one wasn't left by the current user
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '/test_entry_note',
              data: {
                select: { column: [ 'user_id' ] },
                modifier: { order: { datetime: true }, limit: 1 }
              }
            } ).query().then( function( response ) {
              // don't defer until the last note left was left by the current user
              return !angular.isArray( response.data ) ||
                     0 == response.data.length ||
                     response.data[0].user_id != CnSession.user.id ?
                CnModalTextFactory.instance( {
                  title: 'Deferral Message',
                  message: 'Please provide the reason for deferral:',
                  minLength: self.parentModel.isTypist ? 10 : 0
                } ).show().then( function( response ) {
                  if( response ) {
                    return $q.all( [
                      CnHttpFactory.instance( {
                        path: self.parentModel.getServiceResourcePath() + '/test_entry_note',
                        data: { user_id: CnSession.user.id, datetime: moment().format(), note: response }
                      } ).post(),
                      defer()
                    ] );
                  }
                } ) : defer();
            } );
          },
          returnToTypist: function() {
            self.isWorking = true;
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath(),
              data: { state: 'assigned' }
            } ).patch().then( function() {
              self.record.state = 'assigned';
              self.isWorking = false;
            } );
          },
          viewNotes: function() {
            $state.go( 'test_entry.notes', { identifier: self.record.getIdentifier() } );
          },
          previous: function() {
            return null == self.record.prev_test_entry_id ?
              self.parentModel.transitionToParentViewState(
                'transcription', 'uid=' + self.record.transcription_uid
              ) : self.parentModel.transitionToViewState( {
                getIdentifier: function() { return self.record.prev_test_entry_id; }
              } );
          },
          next: function() {
            return null == self.record.next_test_entry_id ?
              self.parentModel.transitionToParentViewState(
                'transcription', 'uid=' + self.record.transcription_uid
              ) : self.parentModel.transitionToViewState( {
                getIdentifier: function() { return self.record.next_test_entry_id; }
              } );
          },
          reset: function() {
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '?reset=1',
            } ).patch();
          },
          close: function() {
            if( self.parentModel.isTypist ) {
              self.isWorking = true;
              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '?close=1',
                onError: function( response ) {
                  // ignore 403 errors since records may automatically be unassigned
                  if( 403 == response.status ) {
                    console.info( 'The "403 (Forbidden)" error found abive is normal and can be ignored.' );
                    return CnModalMessageFactory.httpError( response );
                  }
                }
              } ).patch().then( function() {
                self.isWorking = false;
              } );
            }
          },
          viewTranscription: function() {
            return $state.go( 'transcription.view', { identifier: 'uid=' + self.record.transcription_uid } );
          }
        } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryModelFactory', [
    'CnBaseModelFactory', 'CnTestEntryListFactory', 'CnTestEntryViewFactory',
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseModelFactory, CnTestEntryListFactory, CnTestEntryViewFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnTestEntryListFactory.instance( this );
        this.viewModel = CnTestEntryViewFactory.instance( this, root );

        this.isTypist = true;
        CnSession.promise.then( function() { self.isTypist = 'typist' == CnSession.role.name; } );

        this.transitionToParentViewState = function( subject, identifier ) {
          // check if the user still has access to the transcription before proceeding
          return CnHttpFactory.instance( {
            path: subject + '/' + identifier,
            data: { select: { column: [ 'id' ] } },
            onError: function( response ) {
              // redirect to the transcription list if we get a 404
              return 403 == response.status ?
                self.transitionToParentListState( subject ) :
                CnModalMessageFactory.httpError( response );
            }
          } ).get().then( function() {
            return self.$$transitionToParentViewState( subject, identifier );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryNotesFactory', [
    'CnBaseNoteFactory', 'CnSession', 'CnHttpFactory', '$state', '$q',
    function( CnBaseNoteFactory, CnSession, CnHttpFactory, $state, $q ) {
      var object = function() {
        var self = this;
        CnBaseNoteFactory.construct( this, module );

        var noteModule = cenozoApp.module( 'test_entry_note' );
        angular.extend( this, {
          noteSubject: 'test_entry_note',
          allowDelete: angular.isDefined( noteModule.actions.delete ),
          allowEdit: angular.isDefined( noteModule.actions.edit )
        } );

        $q.all( [
          this.onView(),
          CnHttpFactory.instance( {
            path: 'test_entry/' + $state.params.identifier,
            data: {
              select: {
                column: [ {
                  table: 'transcription',
                  column: 'uid',
                  alias: 'transcription_uid'
                }, {
                  table: 'test_type',
                  column: 'name',
                  alias: 'test_type_name'
                } ]
              }
            }
          } ).get().then( function( response ) {
            self.uid = response.data.transcription_uid;
            self.test_type_name = response.data.test_type_name;
          } )
        ] ).then( function() {
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Transcription',
              go: function() { $state.go( 'transcription.list' ); }
            }, {
              title: self.uid,
              go: function() { $state.go( 'transcription.view', { identifier: 'uid=' + self.uid } ); }
            }, {
              title: 'Test Entries',
            }, {
              title: self.test_type_name,
              go: function() { $state.go( 'test_entry.view', $state.params ); }
            }, {
              title: 'Notes'
            } ]
          );
        } );
      };

      return { instance: function() { return new object(); } };
    }
  ] );
} );
