define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'transcription', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'uid' },
    name: {
      singular: 'transcription',
      plural: 'transcriptions',
      possessive: 'transcription\'s'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
      },
      cohort: {
        column: 'cohort.name',
        title: 'Cohort'
      },
      user: {
        column: 'user.name',
        title: 'Assigned',
        isIncluded: function( $state, model ) { return !model.isRole( 'typist' ); },
        help: 'Which user the transcription is assigned to'
      },
      user_list: {
        title: 'User List',
        isIncluded: function( $state, model ) { return !model.isRole( 'typist' ); },
        help: 'Which users have worked with at least one test-entry, ordered by first access date'
      },
      language_list: {
        title: 'Language List',
        help: 'Which languages the transcription has been associated with (based on all test-entries)'
      },
      site: {
        column: 'site.name',
        title: 'Credited Site',
        isIncluded: function( $state, model ) { return !model.isRole( 'typist' ); }
      },
      state: {
        title: 'State',
        type: 'string',
        isIncluded: function( $state, model ) { return !model.isRole( 'typist' ); },
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
      isExcluded: 'add',
      isConstant: true
    },
    user_id: {
      title: 'User',
      type: 'hidden',
      help: 'Which user the transcription is assigned to'
    },
    site_id: {
      title: 'Credited Site',
      type: 'hidden',
      isExcluded: 'add',
      isConstant: function( $state, model ) { return !model.isRole( 'administrator' ); }
    },
    state: {
      title: 'State',
      type: 'hidden',
      isExcluded: 'add',
      isConstant: true,
      help: 'One of "assigned", "deferred" or "completed"'
    },
    start_datetime: {
      column: 'start_datetime',
      title: 'Start Date & Time',
      type: 'datetimesecond',
      isExcluded: 'add',
      isConstant: true
    },
    end_datetime: {
      column: 'end_datetime',
      title: 'End Date & Time',
      type: 'datetimesecond',
      isExcluded: 'add',
      isConstant: true,
      help: 'Only set when the state is "completed"'
    }
  } );

  if( angular.isDefined( module.actions.multiedit ) ) {
    module.addExtraOperation( 'list', {
      title: 'Multiedit',
      operation: function( $state, model ) { $state.go( 'transcription.multiedit' ); }
    } );
  }

  module.addExtraOperation( 'list', {
    title: 'Rescore All',
    isIncluded: function( $state, model ) {
      return 'transcription.list' == $state.current.name && model.canRescoreTestEntries();
    },
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
  cenozo.providers.directive( 'cnTranscriptionMultiedit', [
    'CnTranscriptionMultieditFactory', 'CnSession', '$state', '$timeout',
    function( CnTranscriptionMultieditFactory, CnSession, $state, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'multiedit.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnTranscriptionMultieditFactory.instance();
          $scope.tab = 'transcription';
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participants',
              go: function() { $state.go( 'transcription.list' ); }
            }, {
              title: 'Multi-Edit'
            } ]
          );

          // trigger the elastic directive when confirming the transcription selection
          $scope.confirm = function() {
            $scope.model.confirm();
            $timeout( function() { angular.element( '#uidListString' ).trigger( 'elastic' ) }, 100 );
          };
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
  cenozo.providers.factory( 'CnTranscriptionMultieditFactory', [
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnSession, CnHttpFactory, CnModalMessageFactory ) {
      var object = function() {
        var self = this;
        this.module = module;
        this.confirmInProgress = false;
        this.confirmedCount = null;
        this.importRestriction = 'no-import';
        this.uidListString = '';
        this.siteList = [];
        this.userList = [];
        this.site_id = undefined;
        this.user_id = undefined;

        this.selectionChanged = function() {
          this.confirmedCount = null;
          this.site_id = undefined;
          this.user_id = undefined;
          this.siteList = [];
          this.userList = [];
        };

        this.selectSite = function() {
          if( angular.isDefined( this.site_id ) ) {
            this.user_id = undefined;
            var siteObject = this.siteList.findByProperty( 'value', this.site_id );
            if( siteObject ) this.userList = siteObject.userList;
          }
        };

        this.confirm = function() {
          this.confirmInProgress = true;
          this.confirmedCount = null;
          var uidRegex = new RegExp( CnSession.application.uidRegex );

          // clean up the uid list
          var fixedList =
            this.uidListString.toUpperCase() // convert to uppercase
                        .replace( /[\s,;|\/]/g, ' ' ) // replace whitespace and separation chars with a space
                        .replace( /[^a-zA-Z0-9 ]/g, '' ) // remove anything that isn't a letter, number of space
                        .split( ' ' ) // delimite string by spaces and create array from result
                        .filter( function( uid ) { // match UIDs (eg: A123456)
                          return null != uid.match( uidRegex );
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
              path: 'transcription',
              data: { uid_list: fixedList, import_restriction: self.importRestriction }
            } ).post().then( function( response ) {
              self.confirmedCount = response.data.length;
              self.uidListString = response.data.join( ' ' );
              self.confirmInProgress = false;

              // get the user list (typists only)
              self.siteList = [ {
                name: 'no-import' == self.importRestriction ? '(Select Site)' : '(empty)',
                value: undefined,
                siteList: []
              } ];
              self.userList = [ {
                name: 'no-import' == self.importRestriction ? '(Select Typist)' : '(empty)',
                value: undefined
              } ];
              return CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'site.name' }
                }
              } ).query().then( function( response ) {
                response.data.forEach( function( item ) {
                  var currentSiteId = item.id;
                  self.siteList.push( {
                    name: item.name,
                    value: item.id,
                    userList: [ {
                      name: 'no-import' == self.importRestriction ? '(Select Typist)' : '(empty)',
                      value: undefined
                    } ]
                  } );

                  return CnHttpFactory.instance( {
                    path: 'user',
                    data: {
                      select: { distinct: true, column: [ 'id', 'name', 'first_name', 'last_name' ] },
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
                          value: currentSiteId
                        } ],
                        order: 'user.name'
                      }
                    }
                  } ).query().then( function( response ) {
                    response.data.forEach( function( item ) {
                      self.siteList.findByProperty( 'value', currentSiteId ).userList.push( {
                        value: item.id,
                        name: item.first_name + ' ' + item.last_name + ' (' + item.name + ')',
                        user: item.name
                      } );
                    } );
                  } );

                } );
              } );
            } );
          }
        };

        this.processList = function( type ) {
          // test the formats of all columns
          var uidList = this.uidListString.split( ' ' );

          CnHttpFactory.instance( {
            path: 'transcription',
            data: {
              uid_list: uidList,
              user_id: self.user_id,
              site_id: self.site_id,
              import_restriction: self.importRestriction,
              process: true
            },
            onError: CnModalMessageFactory.httpError
          } ).post().then( function() {
            var userString = '';
            if( angular.isDefined( self.user_id ) ) {
              userString += ' and assigned to user "' +
                            self.userList.findByProperty( 'value', self.user_id ).user + '"';

              if( angular.isDefined( self.site_id ) ) {
                userString += ' at site "' +
                              self.siteList.findByProperty( 'value', self.site_id ).name + '"';
              }
            }
            userString += '.';

            CnModalMessageFactory.instance( {
              title: 'Transcription(s) Processed',
              message: 'A total of ' + uidList.length + ' transcription' +
                       ( 1 != uidList.length ? 's have ' : ' has ' ) +
                       'been processed' + userString
            } ).show().then( function() {
              self.confirmedCount = null;
              self.importRestriction = 'no-import';
              self.uidListString = '';
              self.userList = [];
              self.user_id = undefined;
            } );
          } );
        };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root, 'test_entry' );

        // never allow the language list to be changed directly, this is done automatically by the database
        this.deferred.promise.then( function() {
          if( angular.isDefined( self.languageModel ) ) {
            self.languageModel.getChooseEnabled = function() { return false; };
            self.languageModel.listModel.heading = 'Language List (based on all test-entries)';
          }
        } );

        // extend onView
        this.onView = function( force ) {
          return this.$$onView( force ).then( function() {
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

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name', limit: 1000 }
              }
            } ).query().then( function( response ) {
              self.metadata.columnList.site_id = { enumList: [] };
              response.data.forEach( function( item ) {
                self.metadata.columnList.site_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } );
          } );
        };

        this.canRescoreTestEntries = function() { return 2 < CnSession.role.tier; };

        if( !this.isRole( 'typist' ) ) {
          var inputList = module.inputGroupList.findByProperty( 'title', '' ).inputList;
          inputList.user_id.type = 'enum';
          inputList.site_id.type = 'enum';
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

            var modifier = {
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
              } ],
              order: 'name'
            };

            // restrict non all-site roles to the participant's site
            if( !CnSession.role.allSites ) {
              modifier.where.push( {
                column: 'access.site_id',
                operator: '=',
                value: response.data.site_id
              } );
            }

            return CnHttpFactory.instance( {
              path: 'user',
              data: {
                select: { column: [ 'id', 'name', 'first_name', 'last_name' ] },
                modifier: modifier
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
