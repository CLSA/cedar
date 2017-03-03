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
      reserved: { title: 'Reserved', type: 'boolean' },
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
    reserved: {
      title: 'Reserved',
      type: 'boolean',
      constant: true
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
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
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

        // don't allow reserved dictionaries to be deleted or edited
        angular.extend( this, {
          getDeleteEnabled: function() {
            return (
              'list' == self.getActionFromState() ||
              angular.isUndefined( self.viewModel.record.reserved ) ||
              !self.viewModel.record.reserved
            ) && self.$$getDeleteEnabled();
          },
          getEditEnabled: function() {
            return (
              'list' == self.getActionFromState() ||
              angular.isUndefined( self.viewModel.record.reserved ) ||
              !self.viewModel.record.reserved
            ) && self.$$getEditEnabled()
          }
        } );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
