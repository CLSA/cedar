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

        // write a custom onView function
        object.onView = function() {
          // start by confirming whether or not this is the correct test type for the test entry
          var path = parentModel.getServiceCollectionPath();
          var type = path.substring( path.lastIndexOf( '/' ) + 1 )
                         .substring( 0, path.indexOf( '_' ) )
                         .toUpperCase();
          path = path.substring( 0, path.lastIndexOf( '/' ) );
          return CnHttpFactory.instance( {
            path: path,
            data: { select: { column: [ { table: 'test_type', column: 'name' } ] } } 
          } ).get().then( function( response ) { 
            if( type == response.data.name ) return object.$$onView();
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
