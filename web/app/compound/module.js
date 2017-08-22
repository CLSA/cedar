define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'compound', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'word',
        column: 'word'
      }
    },
    name: {
      singular: 'compound subword',
      plural: 'compound subwords',
      possessive: 'compound subword\'s',
      pluralPossessive: 'compound subwords\''
    },
    columnList: {
      rank: { title: 'Rank', type: 'rank' },
      subword: { column: 'sub_word.word', title: 'Subword' },
      word_id: { column: 'sub_word_id', type: 'hidden' }
    },
    defaultOrder: {
      column: 'compound.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    sub_word_id: {
      title: 'Subword',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'CONCAT( word.word, " [", language.code, "]" )',
        where: 'word.word',
        forceEmptyOnNew: true
      }
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCompoundAdd', [
    'CnCompoundModelFactory',
    function( CnCompoundModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCompoundModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCompoundList', [
    'CnCompoundModelFactory',
    function( CnCompoundModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCompoundModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCompoundView', [
    'CnCompoundModelFactory',
    function( CnCompoundModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCompoundModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundModelFactory', [
    'CnBaseModelFactory', 'CnCompoundAddFactory', 'CnCompoundListFactory', 'CnCompoundViewFactory', '$state',
    function( CnBaseModelFactory, CnCompoundAddFactory, CnCompoundListFactory, CnCompoundViewFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCompoundAddFactory.instance( this );
        this.listModel = CnCompoundListFactory.instance( this );
        this.viewModel = CnCompoundViewFactory.instance( this, root );

        // go directly to the word when clicking on a compound
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
