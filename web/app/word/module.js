define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'word', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'word',
      plural: 'words',
      possessive: 'word\'s',
      pluralPossessive: 'words\''
    },
    columnList: {
      language: {
        column: 'language.name',
        title: 'Language'
      },
      word: { title: 'Word' },
      misspelled: {
        title: 'Misspelled',
        type: 'boolean'
      },
      aft_valid: {
        title: 'AFT Valid',
        type: 'boolean'
      },
      fas_valid: {
        title: 'FAS Valid',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'word',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    language_id: {
      title: 'Language',
      type: 'enum'
    },
    word: {
      title: 'Word',
      type: 'string'
    },
    misspelled: {
      title: 'Misspelled',
      type: 'boolean'
    },
    aft_valid: {
      title: 'AFT Valid',
      type: 'boolean'
    },
    fas_valid: {
      title: 'FAS Valid',
      type: 'boolean'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordAdd', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordList', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordView', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordModelFactory', [
    'CnBaseModelFactory',
    'CnWordAddFactory', 'CnWordListFactory', 'CnWordViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory,
              CnWordAddFactory, CnWordListFactory, CnWordViewFactory, CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnWordAddFactory.instance( this );
        this.listModel = CnWordListFactory.instance( this );
        this.viewModel = CnWordViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { where: { column: 'active', operator: '=', value: true }, order: { name: false } }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.language_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.language_id.enumList.push( { value: item.id, name: item.name } );
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
