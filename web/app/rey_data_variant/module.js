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
      variant: { column: 'variant.word', title: 'Variant' },
      variant_language: { column: 'variant_language.name', title: 'Variant Language' }
    },
    defaultOrder: {
      column: 'language.name',
      reverse: false
    }
  } );

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
  cenozo.providers.factory( 'CnReyDataVariantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataVariantModelFactory', [
    'CnBaseModelFactory', 'CnReyDataVariantListFactory',
    function( CnBaseModelFactory, CnReyDataVariantListFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnReyDataVariantListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
