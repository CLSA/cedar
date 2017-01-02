define( [ 'aft_data', 'mat_data', 'rey1_data', 'rey2_data' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_entry', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'transcription',
        column: 'transcription_id',
      }
    },
    name: {
      singular: 'test entry',
      plural: 'test entries',
      possessive: 'test entry\'s',
      pluralPossessive: 'test entries\''
    },
    columnList: {
      test_type_rank: {
        column: 'test_type.rank',
        title: 'Rank'
      },
      test_type_name: {
        column: 'test_type.name',
        title: 'Type'
      },
      user_list: {
        title: 'User List',
        isIncluded: function( $state, model ) { return !model.isTypist(); },
        help: 'Which users have worked with the test-entry, ordered by first access date'
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
    test_type_rank: {
      column: 'test_type.rank',
      title: 'Rank',
      constant: true
    },
    test_type_name: {
      column: 'test_type.name',
      title: 'Type',
      constant: true
    },
    state: {
      title: 'State',
      type: 'enum',
      constant: true
    },
    note: {
      title: 'Deferral Note',
      constant: true
    }
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
  cenozo.providers.directive( 'cnTestEntryView', [
    'CnTestEntryModelFactory',
    function( CnTestEntryModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;

          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          $scope.refresh = function() {
            if( $scope.isComplete ) {
              $scope.isComplete = false;
              var type = $scope.model.viewModel.record.test_type_name.toLowerCase() + 'DataModel';
              var dataModel = type.charAt( 0 ).toUpperCase() + type.substring( 1 );

              // update the data record
              $scope.model.viewModel[dataModel].viewModel.onView();

              // update the test entry record
              $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true } );
            }
          };
        },
        link: function( scope, element ) {
          // close the test entry activity
          scope.$on( '$stateChangeStart', function() { scope.model.viewModel.close(); } );
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
    'CnAftDataModelFactory', 'CnMatDataModelFactory', 'CnRey1DataModelFactory', 'CnRey2DataModelFactory', 
    'CnSession', 'CnHttpFactory', 'CnModalTextFactory', '$state',
    function( CnBaseViewFactory,
              CnAftDataModelFactory, CnMatDataModelFactory, CnRey1DataModelFactory, CnRey2DataModelFactory,
              CnSession, CnHttpFactory, CnModalTextFactory, $state ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // add the test entry's data model
        this.AftDataModel = CnAftDataModelFactory.instance();
        this.MatDataModel = CnMatDataModelFactory.instance();
        this.Rey1DataModel = CnRey1DataModelFactory.instance();
        this.Rey2DataModel = CnRey2DataModelFactory.instance();
        this.isWorking = false;

        this.onView = function() {
          return this.$$onView().then( function() {
            if( 'typist' == CnSession.role.name ) {
              // turn off edit privilege if entry is not assigned
              self.parentModel.getEditEnabled = function() {
                return self.parentModel.$$getEditEnabled() && 'assigned' == self.record.state;
              };
            }
          } );
        };

        this.submit = function() {
          this.isWorking = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: { state: 'submitted' }
          } ).patch().then( function() {
            self.record.state = 'submitted';
            self.isWorking = false;
            if( 'typist' == CnSession.role.name )
              return self.parentModel.transitionToParentViewState( 'transcription', self.record.transcription_id );
          } );
        };

        this.defer = function() {
          this.isWorking = true;
          return CnModalTextFactory.instance( {
            title: 'Deferral Message',
            message: 'Please provide the reason for deferral:',
            minLength: 'typist' == CnSession.role.name ? 10 : 0
          } ).show().then( function( response ) {
            if( response ) {
              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: { state: 'deferred', note: response }
              } ).patch().then( function() {
                self.record.state = 'deferred';
                self.record.note = response;
                self.isWorking = false;
                if( 'typist' == CnSession.role.name )
                  return self.parentModel.transitionToParentViewState(
                    'transcription', self.record.transcription_id
                  );
              } );
            } else self.isWorking = false;
          } );
        };

        this.returnToTypist = function() {
          this.isWorking = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: { state: 'assigned', note: null }
          } ).patch().then( function() {
            self.record.state = 'assigned';
            self.isWorking = false;
          } );
        };

        this.close = function() {
          if( 'typist' == CnSession.role.name ) {
            this.isWorking = true;
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '?close=1',
              onError: function( response ) {
                // ignore 403 errors since records may automatically be unassigned
                if( 403 != response.status ) {
                  console.info( 'The "403 (Forbidden)" error found abive is normal and can be ignored.' );
                  return CnModalMessageFactory.httpError( response );
                }
              }
            } ).patch().then( function() {
              self.isWorking = false;
            } );
          }
        };

        this.viewTranscription = function() {
          return $state.go( 'transcription.view', { identifier: this.record.transcription_id } );
        };
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

        this.isTypist = function() { return 'typist' == CnSession.role.name; };

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

} );
