'use strict';

var cenozo = angular.module( 'cenozo' );

cenozo.controller( 'HeaderCtrl', [
  '$scope', 'CnBaseHeader',
  function( $scope, CnBaseHeader ) {
    // copy all properties from the base header
    CnBaseHeader.construct( $scope );
  }
] );

/* ######################################################################################################## */
cenozoApp.initDataModule = function( module, name ) {
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id'
      }
    },
    name: {
      singular: name + ' Data',
      plural: name + ' Data',
      possessive: name + ' Data\'s',
      pluralPossessive: name + ' Data\'s'
    }
  } );
};

/* ######################################################################################################## */
cenozoApp.initDataViewDirective = function( module, model ) {
  return {
    templateUrl: module.getFileUrl( 'view.tpl.html' ),
    restrict: 'E',
    scope: { model: '=?', editEnabled: '=' },
    controller: function( $scope ) {
      if( angular.isUndefined( $scope.model ) ) $scope.model = model;
      
      $scope.isComplete = false;
      $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );
      
      $scope.patch = function() {
        if( $scope.model.getEditEnabled() )
          $scope.model.viewModel.onPatch( { value: $scope.model.viewModel.record.value } );
      };  
    } 
  };
};


/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataViewFactory', [
  'CnBaseViewFactory', 'CnHttpFactory',
  function( CnBaseViewFactory, CnHttpFactory ) {
    return {
      construct: function( object, parentModel, root ) {
        CnBaseViewFactory.construct( object, parentModel, root );

        object.getTestEntryPath = function() {
          var path = parentModel.getServiceCollectionPath();
          return path.substring( 0, path.lastIndexOf( '/' ) );
        }

        object.getDataType = function() {
          var path = parentModel.getServiceCollectionPath();
          var type = path.substring( path.lastIndexOf( '/' ) + 1 );
          return type.substring( 0, type.indexOf( '_' ) ).toUpperCase();
        }

        // write a custom onView function
        object.onView = function() {
          object.isLoading = true;

          // start by confirming whether or not this is the correct test type for the test entry
          return CnHttpFactory.instance( {
            path: object.getTestEntryPath(),
            data: { select: { column: [ { table: 'test_type', column: 'name' } ] } } 
          } ).get().then( function( response ) { 
            if( object.getDataType() == response.data.name ) {
              return object.$$onView().then( function() {
                if( 'boolean' == typeof object.record.value ) object.record.value = object.record.value ? 1 : 0;
              } );
            }
          } );
        };  
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataModelFactory', [
  'CnBaseModelFactory', 'CnSession', '$state',
  function( CnBaseModelFactory, CnSession, $state ) {
    return {
      construct: function( object, module ) {
        CnBaseModelFactory.construct( object, module );

        object.getServiceResourcePath = function( resource ) {
          var path = object.getServiceCollectionPath();
          var type = path.substring( path.lastIndexOf( '/' ) + 1 );
          return type + '/test_entry_id=' + $state.params.identifier;
        };

        object.isTypist = function() {
          console.log( 'typist' == CnSession.role.name );
          return 'typist' == CnSession.role.name;
        };
      }
    };
  }
] );
