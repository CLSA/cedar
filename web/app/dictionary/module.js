define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'dictionary', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'dictionary',
      plural: 'dictionaries',
      possessive: 'dictionary\'s',
      pluralPossessive: 'dictionaries\''
    },
    columnList: {
      name: { title: 'Name' },
      word_count: { title: 'Words' }
    },
    defaultOrder: {
      column: 'dictionary.name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDictionaryAdd', [
    'CnDictionaryModelFactory',
    function( CnDictionaryModelFactory ) { 
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDictionaryModelFactory.root;
        }
      };  
    }   
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDictionaryList', [
    'CnDictionaryModelFactory',
    function( CnDictionaryModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDictionaryModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnDictionaryView', [
    'CnDictionaryModelFactory',
    function( CnDictionaryModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnDictionaryModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDictionaryAddFactory', [
    'CnBaseAddFactory', 'CnModalMessageFactory',
    function( CnBaseAddFactory, CnModalMessageFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDictionaryListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDictionaryViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnDictionaryModelFactory', [
    'CnBaseModelFactory', 'CnDictionaryAddFactory', 'CnDictionaryListFactory', 'CnDictionaryViewFactory',
    function( CnBaseModelFactory, CnDictionaryAddFactory, CnDictionaryListFactory, CnDictionaryViewFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnDictionaryAddFactory.instance( this );
        this.listModel = CnDictionaryListFactory.instance( this );
        this.viewModel = CnDictionaryViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
