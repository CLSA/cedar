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
    'CnTestEntryNotesFactory',
    function( CnTestEntryNotesFactory ) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'notes.tpl.html' ),
        restrict: 'E',
        controller: async function( $scope ) {
          angular.extend( $scope, {
            model: CnTestEntryNotesFactory.instance(),

            // trigger the elastic directive when adding a note or undoing
            addNote: async function() {
              await $scope.model.addNote();
              angular.element( '#newNote' ).trigger( 'elastic' );
            },

            undo: async function( id ) {
              $scope.model.undo( id );
              angular.element( '#note' + id ).trigger( 'elastic' );
            },

            refresh: async function() {
              await $scope.model.onView();
            }
          } );

          await $scope.model.onView();
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
        controller: async function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;

          $scope.isComplete = false;

          angular.extend( $scope, {
            refresh: async function() {
              if( $scope.isComplete ) {
                $scope.isComplete = false;
                // update the data record
                var type = $scope.model.viewModel.record.data_type + 'DataModel';
                $scope.model.viewModel[type].viewModel.onView();

                // update the test entry record
                try {
                  await $scope.model.viewModel.onView();
                } finally {
                  $scope.isComplete = true;
                }
              }
            },
            reset: async function() {
              if( $scope.isComplete ) {
                var response = await CnModalConfirmFactory.instance( {
                  title: 'Reset Entry?',
                  message: 'Are you sure you wish to reset the entry?'
                } ).show();

                if( response ) {
                  await $scope.model.viewModel.reset();
                  $scope.refresh();
                }
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

          try {
            await $scope.model.viewModel.onView();
          } finally {
            $scope.isComplete = true;
          }
        },
        link: async function( scope, element ) {
          // close the test entry activity
          scope.$on( '$stateChangeStart', function() { scope.model.viewModel.close(); } );

          // attach the sound file elements to the view model's list of sound files
          await scope.model.viewModel.onViewPromise;

          $timeout( function() {
            var audioList = element[0].querySelectorAll( 'audio' );
            [].forEach.call( audioList, function( audioEl ) {
              var id = audioEl.id.replace( 'soundFile', '' );
              scope.model.viewModel.soundFileList.findByProperty( 'id', id ).element = audioEl;
            } );
          }, 200 );
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
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalTextFactory', 'CnModalSelectTypistFactory', '$state',
    function( CnBaseViewFactory,
              CnAftDataModelFactory, CnFasDataModelFactory, CnMatDataModelFactory,
              CnPrematDataModelFactory, CnReyDataModelFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory, CnModalTextFactory, CnModalSelectTypistFactory, $state ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'language' );

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
          updateAudioStatusList: async function() {
            if( !this.updatingAudioStatusList ) {
              this.updatingAudioStatusList = true;

              try {
                var response = await CnHttpFactory.instance( {
                  path: 'test_type/' + this.record.test_type_id + '/status_type',
                  data: {
                    select: { column: [ 'id', 'category', 'name' ] },
                    modifier: { order: 'status_type.rank' }
                  }
                } ).query();

                // rebuild the three status lists based on what this test type will allow
                var enumList = [ { value: '', name: '(empty)' } ];
                var audioFound = false;
                var participantFound = false;
                var adminFound = false;
                this.parentModel.metadata.columnList.audio_status_type_id.enumList = angular.copy( enumList );
                this.parentModel.metadata.columnList.participant_status_type_id.enumList = angular.copy( enumList );
                this.parentModel.metadata.columnList.admin_status_type_id.enumList = angular.copy( enumList );

                var self = this;
                response.data.forEach( function( statusType ) {
                  if( self.record.audio_status_type_id == statusType.id ) audioFound = true;
                  else if( self.record.participant_status_type_id == statusType.id ) participantFound = true;
                  else if( self.record.admin_status_type_id == statusType.id ) adminFound = true;
                  self.parentModel.metadata.columnList[statusType.category+'_status_type_id'].enumList.push(
                    { value: statusType.id, name: statusType.name }
                  );
                } );

                // since it's possible that the chosen status is no longer available for this test type we need to add it
                if( !audioFound && this.record.audio_status_type_id ) {
                  this.parentModel.metadata.columnList.audio_status_type_id.enumList.push(
                    { value: this.record.audio_status_type_id, name: this.record.audio_status_type }
                  );
                }

                if( !participantFound && this.record.participant_status_type_id ) {
                  this.parentModel.metadata.columnList.participant_status_type_id.enumList.push(
                    { value: this.record.participant_status_type_id, name: this.record.participant_status_type }
                  );
                }
                
                if( !adminFound && this.record.admin_status_type_id ) {
                  this.parentModel.metadata.columnList.admin_status_type_id.enumList.push(
                    { value: this.record.admin_status_type_id, name: this.record.admin_status_type }
                  );
                }
              } finally {
                this.updatingAudioStatusList = false;
              }
            }
          },

          onView: async function( force ) {
            // get the number of notes
            var response = await CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/test_entry_note'
            } ).count();

            this.noteCount = response.headers( 'Total' );

            this.onViewPromise = await this.$$onView( force );

            // get the sound file list for this test-entry
            await this.updateAudioStatusList();

            try {
              var self = this;
              var response = await CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath() + '/sound_file',
                data: { select: { column: [ 'id', 'name', 'url', 'identifying' ] } },
                onError: function( error ) {
                  // don't show error message for missing recordings (too disruptive)
                  if( 404 == error.status ) {
                    console.warn(
                      'Problem loading sound files for ' + self.parentModel.getServiceResourcePath() );
                  } else return CnModalMessageFactory.httpError( error );
                }
              } ).query();

              this.soundFileList = response.data;
            } catch( error ) {
              // handled by onError above
            }

            // add an active property to track which recording the user is working with
            this.soundFileList.forEach( function( soundFile, index ) { soundFile.active = 0 == index; } );
          },

          // Sets the state of a test entry
          // forceNote can be one of:
          //   true: will make sure that the last note left for this test entry was left but the current user
          //   'typist': if the current user is a typist then will make sure the last note was left the the user
          //   undefined or false: notes are not required
          setState: async function( state, forceNote ) {
            var checkNote = false;
            if( forceNote ) checkNote = 'typist' == forceNote ? this.parentModel.isRole( 'typist' ) : true;

            var proceed = true;
            if( checkNote ) {
              // force a new message if the last one wasn't left by the current user
              var response = await CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath() + '/test_entry_note',
                data: {
                  select: { column: [ 'user_id' ] },
                  modifier: { order: { datetime: true }, limit: 1 }
                }
              } ).query();

              // don't proceed until the last note left was left by the current user
              if( !angular.isArray( response.data ) || 0 == response.data.length || response.data[0].user_id != CnSession.user.id ) {
                var response = await CnModalTextFactory.instance( {
                  title: 'Test Entry Note',
                  message: 'Please provide the reason you are changing the test entry\'s state:',
                  minLength: 10
                } ).show();

                if( response ) {
                  this.noteCount++;
                  await CnHttpFactory.instance( {
                    path: this.parentModel.getServiceResourcePath() + '/test_entry_note',
                    data: { user_id: CnSession.user.id, datetime: moment().format(), note: response }
                  } ).post();
                } else {
                  // don't set the state if the user failed to provide a reason
                  proceed = false;
                }
              }
            }

            if( proceed ) {
              this.isWorking = true;
              try {
                var self = this;
                await CnHttpFactory.instance( {
                  path: this.parentModel.getServiceResourcePath(),
                  data: { state: state },
                  onError: function( error ) {
                    if( 409 == error.status ) {
                      var message = 'The test-entry cannot be submitted if it ';
                      message += 'aft' == self.record.data_type || 'fas' == self.record.data_type
                               ? 'contains invalid words or placeholders.'
                               : 'rey' == self.record.data_type
                               ? 'contains invalid words or there is missing data.'
                               : 'is missing data.';
                      return CnModalMessageFactory.instance( { title: 'Cannot Submit', message: message } ).show();
                    } else CnModalMessageFactory.httpError( error );
                  }
                } ).patch();

                this.record.state = state;
                if( 'assigned' != state && this.parentModel.isRole( 'typist' ) ) await this.transition( 'next' );
              } catch( error ) {
                // handled by onError above
              } finally {
                this.isWorking = false;
              }
            }
          },

          otherStatusTypeSelected: function( type ) {
            var strProp = type + '_status_type';
            return null != this.record[strProp] && null != this.record[strProp].match( 'Other' );
          },
          patchStatus: async function( type ) {
            // Patching status is special since it can be done under some circumstances where the test-entry
            // is not editable
            if( this.parentModel.getStatusEditEnabled() ) {
              var strProp = type + '_status_type';
              var idProp = strProp + '_id';
              var otherProp = strProp + '_other';
              var data = {};

              data[idProp] = '' == this.record[idProp] ? null : this.record[idProp];
              var statusType = this.parentModel.metadata.columnList[idProp].enumList.findByProperty( 'value', data[idProp] );
              if( null == statusType || null == statusType.name.match( 'Other' ) ) this.record[otherProp] = null;
              data[otherProp] = this.record[otherProp];

              // also update the status_type string value
              this.record[strProp] = null == statusType ? null : statusType.name;

              await CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath(),
                data: data
              } ).patch();
            }
          },
          submit: async function() {
            // make sure that other status boxes aren't empty
            if( ( this.otherStatusTypeSelected( 'audio' ) && !this.record.audio_status_type_other ) ||
                ( this.otherStatusTypeSelected( 'participant' ) && !this.record.participant_status_type_other ) ||
                ( this.otherStatusTypeSelected( 'admin' ) && !this.record.admin_status_type_other ) ) {
              await CnModalMessageFactory.instance( {
                title: 'Cannot Submit',
                message: 'The test-entry cannot be submitted because a status type of "Other" is selected but additional status ' +
                  'notes have not been provided.'
              } ).show();
            } else {
              var dataModel = null;
              if( 'aft' == this.record.data_type ) {
                dataModel = this.aftDataModel;
              } else if( 'fas' == this.record.data_type ) {
                dataModel = this.fasDataModel;
              } else if( 'mat' == this.record.data_type ) {
                dataModel = this.matDataModel;
              } else if( 'premat' == this.record.data_type ) {
                dataModel = this.prematDataModel;
              } else if( 'rey' == this.record.data_type ) {
                dataModel = this.reyDataModel;
              } else {
                throw new Error( 'Invalid data type "' + this.record.data_type + '"' );
              }

              var response = await dataModel.viewModel.checkBeforeSubmit();
              if( response ) await this.setState( 'submitted' );
            }
          },
          defer: async function() { await this.setState( 'deferred', 'typist' ); },
          returnToTypist: async function() {
            // when reassigning if the transcription is not assigned then ask for who to assign it to
            if( null == this.record.user_id ) {
              var response = await CnModalSelectTypistFactory.instance( {
                message: 'Please select which typist this transcription should be re-assigned to:',
                site_id: this.record.participant_site_id
              } ).show();

              if( null != response ) {
                await this.setState( 'assigned', true );

                await CnHttpFactory.instance( {
                  path: 'transcription/uid=' + this.record.transcription_uid,
                  data: { user_id: response }
                } ).patch();
              }
            } else {
              await this.setState( 'assigned', true );
            }
          },
          viewNotes: function() { $state.go( 'test_entry.notes', { identifier: this.record.getIdentifier() } ); },
          transition: async function( direction ) {
            var self = this;

            var columnName = 'previous' == direction ? 'prev_test_entry_id' : 'next_test_entry_id';
            try {
              await CnHttpFactory.instance( {
                path: 'transcription/uid=' + this.record.transcription_uid,
                data: { select: { column: 'id' } },
                onError: function( error ) {
                  // 403 means the user no longer has access to the transcription, so go back to the list instead
                  return 403 == error.status ?
                    self.parentModel.transitionToParentListState( 'transcription' ) :
                    CnModalMessageFactory.httpError( error );
                }
              } ).get();

              // we still have access to the transcription so go to the next test-entry or parent transcription
              if( null == this.record[columnName] ) {
                await this.parentModel.transitionToParentViewState( 'transcription', 'uid=' + this.record.transcription_uid);
              } else {
                await this.parentModel.transitionToViewState( { getIdentifier: function() { return self.record[columnName]; } } );
              }
            } catch( error ) {
              // handled by onError above
            }
          },
          reset: async function() {
            await CnHttpFactory.instance( { path: this.parentModel.getServiceResourcePath() + '?reset=1', } ).patch();
          },
          close: async function() {
            if( this.parentModel.isRole( 'typist' ) ) {
              try {
                this.isWorking = true;
                await CnHttpFactory.instance( {
                  path: this.parentModel.getServiceResourcePath() + '?close=1',
                  onError: function( error ) {
                    // ignore 403 errors since records may automatically be unassigned
                    if( 403 != error.status ) return CnModalMessageFactory.httpError( error );
                  }
                } ).patch();
              } catch( error ) {
                // handled by onError above
              } finally {
                this.isWorking = false;
              }
            }
          },
          viewTranscription: async function() {
            return await $state.go( 'transcription.view', { identifier: 'uid=' + this.record.transcription_uid } );
          },
          setIdentifying: function( soundFile ) {
            return CnHttpFactory.instance( {
              path: 'sound_file/' + soundFile.id,
              data: { identifying: soundFile.identifying }
            } ).patch();
          }
        } );

        var self = this;
        async function init() {
          await self.deferred.promise;

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
        }

        init();
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

        this.transitionToParentViewState = async function( subject, identifier ) {
          // check if the user still has access to the transcription before proceeding
          try {
            await CnHttpFactory.instance( {
              path: subject + '/' + identifier,
              data: { select: { column: [ 'id' ] } },
              onError: function( error ) {
                // redirect to the transcription list if we get a 404
                return 403 == error.status ?
                  self.transitionToParentListState( subject ) :
                  CnModalMessageFactory.httpError( error );
              }
            } ).get();

            await self.$$transitionToParentViewState( subject, identifier );
          } catch( error ) {
            // errors are handled in onError function above
          }
        };

        async function init() {
          await CnSession.promise;

          if( !self.isRole( 'typist' ) ) {
            self.addColumn( 'score', { title: 'Score', type: 'number' } );
            self.addColumn( 'alt_score', { title: 'Alt Score', type: 'number' } );
          }
        }

        init();
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryNotesFactory', [
    'CnBaseNoteFactory', 'CnSession', 'CnHttpFactory', '$state',
    function( CnBaseNoteFactory, CnSession, CnHttpFactory, $state ) {
      var object = function() {
        CnBaseNoteFactory.construct( this, module );

        var noteModule = cenozoApp.module( 'test_entry_note' );
        angular.extend( this, {
          noteSubject: 'test_entry_note',
          allowDelete: angular.isDefined( noteModule.actions.delete ),
          allowEdit: angular.isDefined( noteModule.actions.edit )
        } );

        var self = this;
        async function init() {
          await self.onView();

          var response = await CnHttpFactory.instance( {
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
          } ).get();

          self.uid = response.data.transcription_uid;
          self.test_type_name = response.data.test_type_name;

          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Transcription',
              go: async function() { await $state.go( 'transcription.list' ); }
            }, {
              title: self.uid,
              go: async function() { await $state.go( 'transcription.view', { identifier: 'uid=' + self.uid } ); }
            }, {
              title: 'Test Entries',
            }, {
              title: self.test_type_name,
              go: async function() { await $state.go( 'test_entry.view', $state.params ); }
            }, {
              title: 'Notes'
            } ]
          );
        }
        
        init();
      };

      return { instance: function() { return new object(); } };
    }
  ] );
} );
