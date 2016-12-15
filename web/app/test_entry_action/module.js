define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_entry_action', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id',
      }
    },
    name: {
      singular: 'test entry action',
      plural: 'test entry actions',
      possessive: 'test entry action\'s',
      pluralPossessive: 'test entry actions\''
    },
    columnList: {
      user: {
        column: 'user.name',
        title: 'User'
      },
      action: {
        title: 'Action'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryActionList', [
    'CnTestEntryActionModelFactory',
    function( CnTestEntryActionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryActionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryActionListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryActionModelFactory', [
    'CnBaseModelFactory', 'CnTestEntryActionListFactory', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseModelFactory, CnTestEntryActionListFactory, CnHttpFactory, CnModalMessageFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnTestEntryActionListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
