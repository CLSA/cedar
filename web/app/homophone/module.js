define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'homophone', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'homophone',
      plural: 'homophones',
      possessive: 'homophone\'s'
    },
    columnList: {
      rank: { title: 'Rank' },
      word: { column: 'word.word', title: 'Word' },
      word_id: { type: 'hidden' }
    },
    defaultOrder: {
      column: 'homophone.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    rank: {
      title: 'Rank',
      type: 'string'
    },
    word_id: {
      title: 'Word',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'word.word',
        where: 'word.word'
      }
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHomophoneList', [
    'CnHomophoneModelFactory',
    function( CnHomophoneModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHomophoneModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHomophoneView', [
    'CnHomophoneModelFactory',
    function( CnHomophoneModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHomophoneModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomophoneListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomophoneViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomophoneModelFactory', [
    'CnBaseModelFactory', 'CnHomophoneListFactory', 'CnHomophoneViewFactory', '$state',
    function( CnBaseModelFactory, CnHomophoneListFactory, CnHomophoneViewFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnHomophoneListFactory.instance( this );
        this.viewModel = CnHomophoneViewFactory.instance( this, root );

        // add word back into the data array (even if word is the parent module)
        this.getDataArray = function( removeList, type ) {
          var data = this.$$getDataArray( removeList, type );
          if( 'list' == type && angular.isUndefined( data.word ) ) data.push( this.columnList.word );
          return data;
        };

        // go directly to the word when clicking on a homophone
        this.transitionToViewState = function( record ) {
          return $state.go( 'word.view', { identifier: record.word_id } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
