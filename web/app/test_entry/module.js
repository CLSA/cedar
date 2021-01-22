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
      friendlyColumn: 'test_type_name'
    },
    columnList: {
      transcription_uid: {
        column: 'participant.uid',
        title: 'UID',
        isIncluded: function( $state, model ) {
          return 'transcription.view' != $state.current.name;
        }
      },
      test_type_name: {
        column: 'test_type.name',
        title: 'Type'
      },
      user_list: {
        title: 'User List',
        isIncluded: function( $state, model ) { return !model.isRole( 'typist' ); },
        help: 'Which users have worked with the test-entry, ordered by first access date'
      },
      language_list: {
        title: 'Language List',
        help: 'Which languages the test entry has been associated with'
      },
      state: {
        title: 'State',
        type: 'string'
      },
    },
    defaultOrder: {
      column: 'test_type.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    user_id: { column: 'transcription.user_id', type: 'hidden' },
    test_type_id: { column: 'test_type.id', type: 'hidden' },
    test_type_name: { column: 'test_type.name', type: 'hidden' },
    data_type: { column: 'test_type.data_type', type: 'hidden' },
    state: { type: 'enum' },
    audio_status_type_id: { type: 'enum' },
    audio_status_type: { column: 'audio_status_type.name', type: 'string' },
    audio_status_type_other: { type: 'string' },
    participant_status_type_id: { type: 'enum' },
    participant_status_type: { column: 'participant_status_type.name', type: 'string' },
    participant_status_type_other: { type: 'string' },
    admin_status_type_id: { type: 'enum' },
    admin_status_type: { column: 'admin_status_type.name', type: 'string' },
    admin_status_type_other: { type: 'string' },
    participant_site_id: { column: 'site.id', type: 'hidden' },
    participant_language_id: { column: 'participant.language_id', type: 'hidden' },
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
            $timeout( function() { angular.element( '#newNote' ).trigger( 'elastic' ) }, 100 );
          };

          $scope.undo = function( id ) {
            $scope.model.undo( id );
            $timeout( function() { angular.element( '#note' + id ).trigger( 'elastic' ) }, 100 );
          };

          $scope.refresh = function() { $scope.model.onView(); };
          $scope.model.onView();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryView', [
    'CnTestEntryModelFactory', 'CnModalConfirmFactory', '$timeout',
    function( CnTestEntryModelFactory, CnModalConfirmFactory, $timeout ) {
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
                // update the data record
                var type = $scope.model.viewModel.record.data_type + 'DataModel';
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
            },
            onKeyboardShortcut: function( event ) {
              if( angular.isObject( event ) && event.ctrlKey && event.shiftKey ) {
                var action = null;
                if( 76 == event.keyCode ) action = 'togglePlay'; // Ctrl + L
                else if( 188 == event.keyCode ) action = 'rewind'; // Ctrl + <
                else if( 190 == event.keyCode ) action = 'forward'; // Ctrl + >

                if( null != action ) {
                  var soundFile = $scope.model.viewModel.soundFileList.findByProperty( 'active', true );

                  if( soundFile ) {
                    var soundEl = soundFile.element;
                    // now determine what to do
                    if( 'togglePlay' == action ) {
                      if( soundEl.paused ) soundEl.play(); else soundEl.pause();
                    } else if( 'rewind' == action ) {
                      soundEl.currentTime -= 10;
                    } else if( 'forward' == action ) {
                      soundEl.currentTime += 10;
                    }
                  }
                }
              }
            },
            selectSoundFile: function( id ) {
              // set the sound file matching the id as active and all others as not-active
              $scope.model.viewModel.soundFileList.forEach( function( soundFile ) {
                soundFile.active = id == soundFile.id;
              } );
            }
          } );
        },
        link: function( scope, element ) {
          // close the test entry activity
          scope.$on( '$stateChangeStart', function() { scope.model.viewModel.close(); } );

          // attach the sound file elements to the view model's list of sound files
          scope.model.viewModel.onViewPromise.then( function() {
            $timeout( function() {
              var audioList = element[0].querySelectorAll( 'audio' );
              [].forEach.call( audioList, function( audioEl ) {
                var id = audioEl.id.replace( 'soundFile', '' );
                scope.model.viewModel.soundFileList.findByProperty( 'id', id ).element = audioEl;
              } );
            }, 200 );
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
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalTextFactory', 'CnModalSelectTypistFactory',
    '$state', '$q',
    function( CnBaseViewFactory,
              CnAftDataModelFactory, CnFasDataModelFactory, CnMatDataModelFactory,
              CnPrematDataModelFactory, CnReyDataModelFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory, CnModalTextFactory, CnModalSelectTypistFactory,
              $state, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root, 'language' );

        // Sets the state of a test entry
        // forceNote can be one of:
        //   true: will make sure that the last note left for this test entry was left but the current user
        //   'typist': if the current user is a typist then will make sure the last note was left the the user
        //   undefined or false: notes are not required
        function setTestEntryState( state, forceNote ) {
          function setState() {
            self.isWorking = true;
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath(),
              data: { state: state },
              onError: function( response ) {
                if( 409 == response.status ) {
                  var message = 'The test-entry cannot be submitted if it ';
                  message += 'aft' == self.record.data_type || 'fas' == self.record.data_type
                           ? 'contains invalid words or placeholders.'
                           : 'rey' == self.record.data_type
                           ? 'contains invalid words or there is missing data.'
                           : 'is missing data.';
                  return CnModalMessageFactory.instance( { title: 'Cannot Submit', message: message } ).show();
                } else CnModalMessageFactory.httpError( response );
              }
            } ).patch().then( function() {
              self.record.state = state;
              if( 'assigned' != state && self.parentModel.isRole( 'typist' ) ) return self.transition( 'next' );
            } ).finally( function() { self.isWorking = false; } );
          }

          var checkNote = false;
          if( forceNote ) checkNote = 'typist' == forceNote ? self.parentModel.isRole( 'typist' ) : true;

          if( checkNote ) {
            // force a new message if the last one wasn't left by the current user
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '/test_entry_note',
              data: {
                select: { column: [ 'user_id' ] },
                modifier: { order: { datetime: true }, limit: 1 }
              }
            } ).query().then( function( response ) {
              // don't proceed until the last note left was left by the current user
              return !angular.isArray( response.data ) ||
                     0 == response.data.length ||
                     response.data[0].user_id != CnSession.user.id ?
                CnModalTextFactory.instance( {
                  title: 'Test Entry Note',
                  message: 'Please provide the reason you are changing the test entry\'s state:',
                  minLength: 10
                } ).show().then( function( response ) {
                  if( response ) {
                    self.noteCount++;
                    return CnHttpFactory.instance( {
                        path: self.parentModel.getServiceResourcePath() + '/test_entry_note',
                        data: { user_id: CnSession.user.id, datetime: moment().format(), note: response }
                    } ).post().then( function() { setState() } );
                  }
                } ) : setState();
            } );
          } else setState();
        }

        this.deferred.promise.then( function() {
          // get and store a list of all languages used by this test-entry
          if( angular.isDefined( self.languageModel ) ) {
            self.languageModel.listModel.afterList( function() {
              if( !self.languageModel.listModel.chooseMode ) {
                self.languageIdList = self.languageModel.listModel.cache.reduce( function( list, language ) {
                  list.push( language.id );
                  return list;
                }, [] );
                if( !self.languageIdList.includes( self.record.participant_language_id ) )
                  self.record.participant_language_id = self.languageIdList[0];
              }
            } );

            // define whether or not the language list can be choosen from
            self.languageModel.getChooseEnabled = function() {
              return self.languageModel.$$getChooseEnabled() &&
                     self.parentModel.$$getEditEnabled() && (
                       !self.parentModel.isTypest || (
                         'assigned' == self.record.state &&
                         'Unusable' != self.record.audio_status &&
                         'Unavailable' != self.record.audio_status &&
                         'Refused' != self.record.participant_status
                       )
                     );
            };
          }

          angular.extend( self.parentModel, {
            getStatusEditEnabled: function() {
              return self.parentModel.$$getEditEnabled() &&
                     ( !self.parentModel.isRole( 'typist' ) || 'assigned' == self.record.state );
            },
            getSubStatusEditEnabled: function( base ) {
              return self.parentModel.$$getEditEnabled() &&
                     'assigned' == self.record.state &&
                     self.record.data_type && (
                       self[self.record.data_type + 'DataModel'].getEditEnabled() ||
                       self[self.record.data_type + 'DataModel'].getAddEnabled()
                     );
            },
            getEditEnabled: function() {
              return self.parentModel.$$getEditEnabled() && (
                       !self.parentModel.isRole( 'typist' ) || (
                         'assigned' == self.record.state &&
                         'Unusable' != self.record.audio_status &&
                         'Unavailable' != self.record.audio_status &&
                         'Refused' != self.record.participant_status
                       )
                     ) &&
                     self.record.data_type && (
                       self[self.record.data_type + 'DataModel'].getEditEnabled() ||
                       self[self.record.data_type + 'DataModel'].getAddEnabled()
                     );
            }
          } );
        } );

        angular.extend( this, {
          onViewPromise: null,
          languageIdList: [],
          soundFileList: [],
          soundFileEnumList: [
            { value: null, name: '(select identifying)' },
            { value: true, name: 'Identifying' },
            { value: false, name: 'Not Identifying' },
          ],

          // add the test entry's data models
          aftDataModel: CnAftDataModelFactory.instance( parentModel ),
          fasDataModel: CnFasDataModelFactory.instance( parentModel ),
          matDataModel: CnMatDataModelFactory.instance( parentModel ),
          prematDataModel: CnPrematDataModelFactory.instance( parentModel ),
          reyDataModel: CnReyDataModelFactory.instance( parentModel ),
          isWorking: false,
          noteCount: 0,
          updatingAudioStatusList: false,
          updateAudioStatusList: function() {
            return self.updatingAudioStatusList ? $q.all() : CnHttpFactory.instance( {
              path: 'test_type/' + self.record.test_type_id + '/status_type',
              data: {
                select: { column: [ 'id', 'category', 'name' ] },
                modifier: { order: 'status_type.rank' }
              }
            } ).query().then( function( response ) {
              self.updatingAudioStatusList = true;

              // rebuild the three status lists based on what this test type will allow
              var enumList = [ { value: '', name: '(empty)' } ];
              var audioFound = false;
              var participantFound = false;
              var adminFound = false;
              self.parentModel.metadata.columnList.audio_status_type_id.enumList = angular.copy( enumList );
              self.parentModel.metadata.columnList.participant_status_type_id.enumList = angular.copy( enumList );
              self.parentModel.metadata.columnList.admin_status_type_id.enumList = angular.copy( enumList );
              response.data.forEach( function( statusType ) {
                if( self.record.audio_status_type_id == statusType.id ) audioFound = true;
                else if( self.record.participant_status_type_id == statusType.id ) participantFound = true;
                else if( self.record.admin_status_type_id == statusType.id ) adminFound = true;
                self.parentModel.metadata.columnList[statusType.category+'_status_type_id'].enumList.push(
                  { value: statusType.id, name: statusType.name }
                );
              } );

              // since it's possible that the chosen status is no longer available for this test type we need to add it
              if( !audioFound && self.record.audio_status_type_id ) {
                self.parentModel.metadata.columnList.audio_status_type_id.enumList.push(
                  { value: self.record.audio_status_type_id, name: self.record.audio_status_type }
                );
              }

              if( !participantFound && self.record.participant_status_type_id ) {
                self.parentModel.metadata.columnList.participant_status_type_id.enumList.push(
                  { value: self.record.participant_status_type_id, name: self.record.participant_status_type }
                );
              }
              
              if( !adminFound && self.record.admin_status_type_id ) {
                self.parentModel.metadata.columnList.admin_status_type_id.enumList.push(
                  { value: self.record.admin_status_type_id, name: self.record.admin_status_type }
                );
              }

              self.updatingAudioStatusList = false;
            } );
          },

          onView: function( force ) {
            // get the number of notes
            CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '/test_entry_note'
            } ).count().then( function( response ) {
              self.noteCount = response.headers( 'Total' );
            } );

            this.onViewPromise = this.$$onView( force ).then( function() {
              // get the sound file list for this test-entry
              return $q.all( [
                self.updateAudioStatusList(),
                CnHttpFactory.instance( {
                  path: self.parentModel.getServiceResourcePath() + '/sound_file',
                  data: { select: { column: [ 'id', 'name', 'url', 'identifying' ] } },
                  onError: function( response ) {
                    // don't show error message for missing recordings (too disruptive)
                    if( 404 == response.status ) {
                      console.warn(
                        'Problem loading sound files for ' + self.parentModel.getServiceResourcePath() );
                    } else return CnModalMessageFactory.httpError( response );
                  }
                } ).query().then( function( response ) {
                  self.soundFileList = response.data;
                  // add an active property to track which recording the user is working with
                  self.soundFileList.forEach( function( soundFile, index ) { soundFile.active = 0 == index; } );
                } )
              ] );
            } );
            return self.onViewPromise;
          },
          otherStatusTypeSelected: function( type ) {
            var strProp = type + '_status_type';
            return null != self.record[strProp] && null != self.record[strProp].match( 'Other' );
          },
          patchStatus: function( type ) {
            // Patching status is special since it can be done under some circumstances where the test-entry
            // is not editable
            if( self.parentModel.getStatusEditEnabled() ) {
              var strProp = type + '_status_type';
              var idProp = strProp + '_id';
              var otherProp = strProp + '_other';
              var data = {};

              data[idProp] = '' == self.record[idProp] ? null : self.record[idProp];
              var statusType = self.parentModel.metadata.columnList[idProp].enumList.findByProperty( 'value', data[idProp] );
              if( null == statusType || null == statusType.name.match( 'Other' ) ) self.record[otherProp] = null;
              data[otherProp] = self.record[otherProp];

              // also update the status_type string value
              self.record[strProp] = null == statusType ? null : statusType.name;

              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: data
              } ).patch();
            }
          },
          submit: function() {
            // make sure that other status boxes aren't empty
            if( ( self.otherStatusTypeSelected( 'audio' ) && !self.record.audio_status_type_other ) ||
                ( self.otherStatusTypeSelected( 'participant' ) && !self.record.participant_status_type_other ) ||
                ( self.otherStatusTypeSelected( 'admin' ) && !self.record.admin_status_type_other ) ) {
              return CnModalMessageFactory.instance( {
                title: 'Cannot Submit',
                message: 'The test-entry cannot be submitted because a status type of "Other" is selected but additional status ' +
                  'notes have not been provided.'
              } ).show();
            } else {
              var dataModel = null;
              if( 'aft' == self.record.data_type ) {
                dataModel = self.aftDataModel;
              } else if( 'fas' == self.record.data_type ) {
                dataModel = self.fasDataModel;
              } else if( 'mat' == self.record.data_type ) {
                dataModel = self.matDataModel;
              } else if( 'premat' == self.record.data_type ) {
                dataModel = self.prematDataModel;
              } else if( 'rey' == self.record.data_type ) {
                dataModel = self.reyDataModel;
              } else {
                throw new Error( 'Invalid data type "' + self.record.data_type + '"' );
              }

              dataModel.viewModel.checkBeforeSubmit().then( function( response ) {
                if( response ) return setTestEntryState( 'submitted' );
              } );
            }
          },
          defer: function() { return setTestEntryState( 'deferred', 'typist' ); },
          returnToTypist: function() {
            // when reassigning if the transcription is not assigned then ask for who to assign it to
            return null == self.record.user_id ?
              CnModalSelectTypistFactory.instance( {
                message: 'Please select which typist this transcription should be re-assigned to:',
                site_id: self.record.participant_site_id
              } ).show().then( function( response ) {
                if( null != response ) {
                  return setTestEntryState( 'assigned', true ).then( function() {
                    return CnHttpFactory.instance( {
                      path: 'transcription/uid=' + self.record.transcription_uid,
                      data: { user_id: response }
                    } ).patch();
                  } );
                }
              } ) : setTestEntryState( 'assigned', true );
          },
          viewNotes: function() { $state.go( 'test_entry.notes', { identifier: self.record.getIdentifier() } ); },
          transition: function( direction ) {
            var columnName = 'previous' == direction ? 'prev_test_entry_id' : 'next_test_entry_id';
            return CnHttpFactory.instance( {
              path: 'transcription/uid=' + self.record.transcription_uid,
              data: { select: { column: 'id' } },
              onError: function( response ) {
                // 403 means the user no longer has access to the transcription, so go back to the list instead
                return 403 == response.status ?
                  self.parentModel.transitionToParentListState( 'transcription' ) :
                  CnModalMessageFactory.httpError( response );
              }
            } ).get().then( function() {
              // we still have access to the transcription so go to the next test-entry or parent transcription
              return null == self.record[columnName] ?
                self.parentModel.transitionToParentViewState(
                  'transcription', 'uid=' + self.record.transcription_uid
                ) : self.parentModel.transitionToViewState( {
                  getIdentifier: function() { return self.record[columnName]; }
                } );
            } );
          },
          reset: function() {
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '?reset=1',
            } ).patch();
          },
          close: function() {
            if( self.parentModel.isRole( 'typist' ) ) {
              self.isWorking = true;
              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '?close=1',
                onError: function( response ) {
                  // ignore 403 errors since records may automatically be unassigned
                  if( 403 != response.status ) return CnModalMessageFactory.httpError( response );
                }
              } ).patch().finally( function() { self.isWorking = false; } );
            }
          },
          viewTranscription: function() {
            return $state.go( 'transcription.view', { identifier: 'uid=' + self.record.transcription_uid } );
          },
          setIdentifying: function( soundFile ) {
            return CnHttpFactory.instance( {
              path: 'sound_file/' + soundFile.id,
              data: { identifying: soundFile.identifying }
            } ).patch();
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

        CnSession.promise.then( function() {
          if( !self.isRole( 'typist' ) ) {
            self.addColumn( 'score', { title: 'Score', type: 'number' } );
            self.addColumn( 'alt_score', { title: 'Alt Score', type: 'number' } );
          }
        } );

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
