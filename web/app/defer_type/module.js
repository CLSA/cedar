define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'defer_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_type',
        column: 'test_type.name'
      }
    },
    name: {
      singular: 'defer type',
      plural: 'defer types',
      possessive: 'defer type\'s',
      pluralPossessive: 'defer types\''
    },
    columnList: {
      message: { title: 'Message' },
    },
    defaultOrder: {
      column: 'defer_type.message',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    message: {
      title: 'Message',
      type: 'string',
      help: 'A pre-defined message which can be applied to this test-type when it is deferred.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDeferTypeAdd', [
    'CnDeferTypeModelFactory',
    function( CnDeferTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDeferTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDeferTypeList', [
    'CnDeferTypeModelFactory',
    function( CnDeferTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDeferTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDeferTypeView', [
    'CnDeferTypeModelFactory',
    function( CnDeferTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDeferTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDeferTypeAddFactory', [
    'CnBaseAddFactory', 'CnModalMessageFactory',
    function( CnBaseAddFactory, CnModalMessageFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDeferTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDeferTypeViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDeferTypeModelFactory', [
    'CnBaseModelFactory',
    'CnDeferTypeAddFactory',
    'CnDeferTypeListFactory',
    'CnDeferTypeViewFactory',
    function( CnBaseModelFactory,
              CnDeferTypeAddFactory,
              CnDeferTypeListFactory,
              CnDeferTypeViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnDeferTypeAddFactory.instance( this );
        this.listModel = CnDeferTypeListFactory.instance( this );
        this.viewModel = CnDeferTypeViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
