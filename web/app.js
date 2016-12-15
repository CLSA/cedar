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
cenozo.factory( 'CnBaseDataViewFactory', [
  'CnBaseViewFactory', 'CnHttpFactory',
  function( CnBaseViewFactory, CnHttpFactory ) {
    return {
      construct: function( object, parentModel, root ) {
        CnBaseViewFactory.construct( object, parentModel, root );

        function getTranscriptionPath() {
          var path = parentModel.getServiceCollectionPath();
          return path.substring( 0, path.lastIndexOf( '/' ) );
        }

        function getDataType() {
          var path = parentModel.getServiceCollectionPath();
          return path.substring( path.lastIndexOf( '/' ) + 1 ).substring( 0, path.indexOf( '_' ) ).toUpperCase();
        }

        object.isWorking = false;

        // write a custom onView function
        object.onView = function() {
          object.isLoading = true;

          // start by confirming whether or not this is the correct test type for the test entry
          return CnHttpFactory.instance( {
            path: getTranscriptionPath(),
            data: { select: { column: [ { table: 'test_type', column: 'name' } ] } } 
          } ).get().then( function( response ) { 
            if( getDataType() == response.data.name ) {
              return object.$$onView().then( function() {
                object.record.value = object.record.value ? 1 : 0;
              } );
            }
          } );
        };  

        object.returnToTypist = function() {
          object.isWorking = true;
          return CnHttpFactory.instance( {
            path: getTranscriptionPath(),
            data: { submitted: false }
          } ).patch().then( function() {
            object.record.submitted = false;
            object.isWorking = false;
          } );
        };

        object.forceSubmit = function() {
          object.isWorking = true;
          return CnHttpFactory.instance( {
            path: getTranscriptionPath(),
            data: { submitted: true }
          } ).patch().then( function() {
            object.record.submitted = true;
            object.isWorking = false;
          } );
        };
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataModelFactory', [
  'CnBaseModelFactory', '$state',
  function( CnBaseModelFactory, $state ) {
    return {
      construct: function( object, module ) {
        CnBaseModelFactory.construct( object, module );

        object.getServiceResourcePath = function( resource ) {
          var path = object.getServiceCollectionPath();
          var type = path.substring( path.lastIndexOf( '/' ) + 1 );
          return type + '/test_entry_id=' + $state.params.identifier;
        };
      }
    };
  }
] );
