define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'status_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'word',
        column: 'word'
      }
    },
    name: {
      singular: 'status type',
      plural: 'status types',
      possessive: 'status type\'s'
    },
    columnList: {
      category: { title: 'Category' },
      rank: { title: 'Rank', type: 'rank' },
      name: { title: 'Name' },
    },
    defaultOrder: {
      column: 'category',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    category: {
      title: 'Category',
      type: 'enum',
      constant: true
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    name: {
      title: 'Name',
      type: 'string'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStatusTypeList', [
    'CnStatusTypeModelFactory',
    function( CnStatusTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStatusTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStatusTypeView', [
    'CnStatusTypeModelFactory',
    function( CnStatusTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStatusTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStatusTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStatusTypeViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory', 'CnModalConfirmFactory',
    function( CnBaseViewFactory, CnHttpFactory, CnModalConfirmFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStatusTypeModelFactory', [
    'CnBaseModelFactory', 'CnStatusTypeListFactory', 'CnStatusTypeViewFactory',
    '$state',
    function( CnBaseModelFactory, CnStatusTypeListFactory, CnStatusTypeViewFactory,
              $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnStatusTypeListFactory.instance( this );
        this.viewModel = CnStatusTypeViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
