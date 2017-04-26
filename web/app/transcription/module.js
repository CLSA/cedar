define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'transcription', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'uid' },
    name: {
      singular: 'transcription',
      plural: 'transcriptions',
      possessive: 'transcription\'s',
      pluralPossessive: 'transcriptions\''
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
      },
      user: {
        column: 'user.name',
        title: 'Assigned',
        isIncluded: function( $state, model ) { return !model.isTypist(); },
        help: 'Which user the transcription is assigned to'
      },
      user_list: {
        title: 'User List',
        isIncluded: function( $state, model ) { return !model.isTypist(); },
        help: 'Which users have worked with at least one test-entry, ordered by first access date'
      },
      language_list: {
        title: 'Language List',
        help: 'Which languages the transcription has been associated with (based on all test-entries)'
      },
      site: {
        column: 'site.name',
        title: 'Site',
        isIncluded: function( $state, model ) { return !model.isTypist(); }
      },
      state: {
        title: 'State',
        type: 'string',
        isIncluded: function( $state, model ) { return !model.isTypist(); },
        help: 'One of "assigned", "deferred" or "completed"'
      },
      start_datetime: {
        column: 'start_datetime',
        title: 'Start',
        type: 'datetimesecond'
      },
      end_datetime: {
        column: 'end_datetime',
        title: 'End',
        type: 'datetimesecond',
        help: 'Only set once all test entries have been submitted'
      }
    },
    defaultOrder: {
      column: 'transcription.start_datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    uid: {
      column: 'participant.uid',
      title: 'Participant',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    user_id: {
      title: 'User',
      type: 'hidden',
      help: 'Which user the transcription is assigned to'
    },
    site: {
      column: 'site.name',
      title: 'Site',
      type: 'hidden',
      exclude: 'add',
      constant: true
    },
    state: {
      title: 'State',
      type: 'hidden',
      exclude: 'add',
      constant: true,
      help: 'One of "assigned", "deferred" or "completed"'
    },
    start_datetime: {
      column: 'start_datetime',
      title: 'Start Date & Time',
      type: 'datetimesecond',
      exclude: 'add',
      constant: true
    },
    end_datetime: {
      column: 'end_datetime',
      title: 'End Date & Time',
      type: 'datetimesecond',
      exclude: 'add',
      constant: true,
      help: 'Only set when the state is "completed"'
    }
  } );

  module.addExtraOperation( 'list', {
    title: 'Rescore All',
    isIncluded: function( $state, model ) { return model.canRescoreTestEntries(); },
    operation: function( $state, model ) {
      model.listModel.rescoreTestEntries().then( function( response ) {
        if( angular.isDefined( response ) ) model.listModel.onList( true );
      } );
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Rescore',
    isIncluded: function( $state, model ) { return model.canRescoreTestEntries(); },
    operation: function( $state, model ) {
      model.viewModel.rescoreTestEntries().then( function( response ) {
        if( angular.isDefined( response ) ) model.viewModel.testEntryModel.listModel.onList( true );
      } );
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionAdd', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionList', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionView', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionAddFactory', [
    'CnBaseAddFactory', 'CnModalMessageFactory',
    function( CnBaseAddFactory, CnModalMessageFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // extend onNew
        this.onNew = function( record ) {
          return this.$$onNew( record ).then( function() {
            return self.parentModel.updateUserList( self.parentModel.getParentIdentifier().identifier );
          } );
        };

        // extend onAddError (must handle 409 errors in a special way)
        this.onAddError = function( response ) {
          if( 409 == response.status ) {
              CnModalMessageFactory.instance( {
                title: 'Cannot Add Transcription',
                message: 'A new transcription cannot be made because the participant already has a ' +
                         'transcription.  Only one transcription can exist per participant.',
                error: true
              } ).show().then( function() { self.parentModel.transitionToLastState(); } );
          } else this.$$onAddError( response );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionListFactory', [
    'CnBaseListFactory', 'CnModalConfirmFactory', 'CnHttpFactory',
    function( CnBaseListFactory, CnModalConfirmFactory, CnHttpFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseListFactory.construct( this, parentModel );

        this.rescoreTestEntries = function() {
          return CnModalConfirmFactory.instance( {
            title: 'Re-Score All Test Entries',
            message: 'Are you sure you wish to re-score all test entries?\n\n' +
                     'This process is processor-intensive and may slow down the application for all ' +
                     'users while scores are being re-calculated.  You should only continue if it is ' +
                     'necessary for tests to be re-scored immediately.'
          } ).show().then( function( response ) {
            if( response ) return CnHttpFactory.instance( { path: 'transcription?rescore=1' } ).count();
          } );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // never allow the language list to be changed directly, this is done automatically by the database
        this.deferred.promise.then( function() {
          if( angular.isDefined( self.languageModel ) ) {
            self.languageModel.getChooseEnabled = function() { return false; };
            self.languageModel.listModel.heading = 'Language List (based on all test-entries)';
          }
        } );

        // extend onView
        this.onView = function() {
          return this.$$onView().then( function() {
            return self.parentModel.updateUserList( 'uid=' + self.record.uid );
          } );
        };

        this.rescoreTestEntries = function() {
          return CnHttpFactory.instance( { path: 'transcription/' + self.record.id + '?rescore=1' } ).get();
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionModelFactory', [
    'CnBaseModelFactory',
    'CnTranscriptionAddFactory', 'CnTranscriptionListFactory', 'CnTranscriptionViewFactory',
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseModelFactory,
              CnTranscriptionAddFactory, CnTranscriptionListFactory, CnTranscriptionViewFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnTranscriptionAddFactory.instance( this );
        this.listModel = CnTranscriptionListFactory.instance( this );
        this.viewModel = CnTranscriptionViewFactory.instance( this, root );

        this.isTypist = function() { return 'typist' == CnSession.role.name; };
        this.canRescoreTestEntries = function() { return 2 < CnSession.role.tier; };

        if( !this.isTypist() ) {
          var inputList = module.inputGroupList.findByProperty( 'title', '' ).inputList;
          inputList.user_id.type = 'enum';
          inputList.site.type = 'string';
          inputList.state.type = 'string';
        }

        // only show the add transcription button for typists
        // (the participant module will add it manually for other roles when necessary)
        this.getAddEnabled = function() {
          if( 'typist' == CnSession.role.name ) {
            return this.$$getAddEnabled() &&
                   'transcription' == this.getSubjectFromState() &&
                   CnSession.setting.maxWorkingTranscriptions > this.listModel.cache.length;
          } else {
            return this.$$getAddEnabled() &&
                   'participant' == this.getSubjectFromState() &&
                   'add_transcription' == this.getActionFromState();
          }
        };

        // adding transcriptions is different for typists and everyone else
        this.getEditEnabled = function() {
          return this.$$getEditEnabled() && 'completed' != this.viewModel.record.state;
        };

        // override transitionToAddState
        this.transitionToAddState = function() {
          // typists immediately get a new transcription (no add state required)
          return 'typist' == CnSession.role.name
            ? CnHttpFactory.instance( {
                path: 'transcription',
                data: { user_id: CnSession.user.id },
                onError: function( response ) {
                  if( 408 == response.status ) {
                    // 408 means there are currently no participants available
                    CnModalMessageFactory.instance( {
                      title: 'No Participants Available',
                      message: response.data,
                      error: true
                    } ).show();
                  } else if( 409 == response.status ) {
                    // 409 means there is a conflict (user cannot start new transcriptions)
                    CnModalMessageFactory.instance( {
                      title: 'Cannot Begin New Transcription',
                      message: response.data,
                      error: true
                    } ).show().then( self.onLoad );
                  } else CnModalMessageFactory.httpError( response );
                }
              } ).post().then( function ( response ) {
                // immediately view the new transcription
                return self.transitionToViewState( { getIdentifier: function() { return response.data; } } );
              } )
            : this.$$transitionToAddState(); // everyone else gets the default behaviour
        };

        // special function to update the user list
        this.updateUserList = function( participantIdentifier ) {
          return CnHttpFactory.instance( {
            path: 'participant/' + participantIdentifier,
            data: { select: { column: [ { table: 'site', column: 'id', alias: 'site_id' } ] } }
          } ).get().then( function( response ) {
            // show a warning if the user doesn't have a site
            if( null == response.data.site_id ) {
              CnModalMessageFactory.instance( {
                title: 'Participant Has No Site',
                message: 'This transcription\'s participant is not associated with a site. Transcriptions ' +
                         'cannot be added or viewed until the participant is assigned to a site.',
                error: true
              } ).show().then( function() { self.transitionToLastState(); } );
            }

            return CnHttpFactory.instance( {
              path: 'user',
              data: {
                select: { column: [ 'id', 'name', 'first_name', 'last_name' ] },
                modifier: {
                  join: [ {
                    table: 'access',
                    onleft: 'user.id',
                    onright: 'access.user_id'
                  }, {
                    table: 'role',
                    onleft: 'access.role_id',
                    onright: 'role.id'
                  } ],
                  where: [ {
                    column: 'role.name',
                    operator: '=',
                    value: 'typist'
                  }, {
                    column: 'access.site_id',
                    operator: '=',
                    value: response.data.site_id
                  } ],
                  order: 'name'
                }
              }
            } ).query().then( function( response ) {
              self.metadata.columnList.user_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.user_id.enumList.push( {
                  value: item.id,
                  name: item.first_name + ' ' + item.last_name + ' (' + item.name + ')'
                } );
              } );
            } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
