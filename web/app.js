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
    identifier: {},/*
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id'
      }
    },*/
    name: {
      singular: name + ' Data',
      plural: name + ' Data',
      possessive: name + ' Data\'s',
      pluralPossessive: name + ' Data\'s'
    }
  } );
};

/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataViewFactory', [
  'CnBaseViewFactory', 'CnHttpFactory', '$q',
  function( CnBaseViewFactory, CnHttpFactory, $q ) {
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
          return type.substring( 0, type.indexOf( '_' ) );
        }

        function convertRecord( record ) {
          for( var property in record ) {
            if( 'boolean' == typeof( record[property] ) ) record[property] = record[property] ? 1 : 0;
          }
        }

        // write a custom onView function
        object.onView = function() {
          object.isLoading = true;

          // start by confirming whether or not this is the correct test type for the test entry
          return CnHttpFactory.instance( {
            path: object.getTestEntryPath(),
            data: { select: { column: [ { table: 'test_type', column: 'data_type' } ] } } 
          } ).get().then( function( response ) { 
            if( object.getDataType() == response.data.data_type ) {
              return $q.all( [
                parentModel.testEntryModel.viewModel.onViewPromise,
                object.$$onView()
              ] ).then( function() {
                delete object.record.getIdentifier; // we don't need the identifier function

                // convert boolean to integer
                if( angular.isObject( object.record ) )
                  for( var property in object.record )
                    if( 'boolean' == typeof( object.record[property] ) )
                      object.record[property] = object.record[property] ? 1 : 0;

                if( angular.isDefined( object.onDataView ) ) return object.onDataView();
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
          return 'premat_data' == type || 'rey_data' == type
               ? type + '/test_entry_id=' + $state.params.identifier
               : 'test_entry/' + $state.params.identifier + '/' + type;
        };

        object.isTypist = function() {
          return 'typist' == CnSession.role.name;
        };
      }
    };
  }
] );
