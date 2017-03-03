define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey_data_variant', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'REY data variant',
      plural: 'REY data variants',
      possessive: 'REY data variant\'s',
      pluralPossessive: 'REY data variants\''
    },
    columnList: {
      word: { title: 'Word' },
      language: { column: 'language.name', title: 'Language' },
      variant: { title: 'Variant' }
    },
    defaultOrder: {
      column: 'language.name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    word: {
      title: 'Keyword',
      type: 'enum',
      help: 'The keyword (shown in English) to add a variant to.'
    },
    language_id: {
      title: 'Language',
      type: 'enum',
      help: 'Which language the variant applies to.'
    },
    variant: {
      title: 'Variant',
      type: 'string',
      help: 'The variant word which can be used in place of the keyword.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataVariantAdd', [
    'CnReyDataVariantModelFactory',
    function( CnReyDataVariantModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataVariantModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataVariantList', [
    'CnReyDataVariantModelFactory',
    function( CnReyDataVariantModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataVariantModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataVariantView', [
    'CnReyDataVariantModelFactory',
    function( CnReyDataVariantModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataVariantModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataVariantAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataVariantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataVariantViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataVariantModelFactory', [
    'CnBaseModelFactory',
    'CnReyDataVariantAddFactory', 'CnReyDataVariantListFactory', 'CnReyDataVariantViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory,
              CnReyDataVariantAddFactory, CnReyDataVariantListFactory, CnReyDataVariantViewFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReyDataVariantAddFactory.instance( this );
        this.listModel = CnReyDataVariantListFactory.instance( this );
        this.viewModel = CnReyDataVariantViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return $q.all( [
              CnHttpFactory.instance( {
                path: 'language',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { where: { column: 'active', operator: '=', value: true }, order: { name: false } }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.language_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.language_id.enumList.push( {
                    value: item.id,
                    name: item.name
                  } );
                } );
              } )
            ] )
          } )
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
