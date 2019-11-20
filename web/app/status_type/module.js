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
      isConstant: 'view'
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
  cenozo.providers.directive( 'cnStatusTypeAdd', [
    'CnStatusTypeModelFactory', '$filter',
    function( CnStatusTypeModelFactory, $filter ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStatusTypeModelFactory.root;

          var cnRecordAddScope = null;
          $scope.$on( 'cnRecordAdd ready', function( event, data ) {
            cnRecordAddScope = data;

            // change the max rank based on the currently selected category
            var checkFunction = cnRecordAddScope.check;
            cnRecordAddScope.check = function( property ) {
              // run the original check function first
              checkFunction( property );
              if( 'category' == property ) {
                var input = cnRecordAddScope.dataArray.findByProperty( 'title', '' ).inputArray.findByProperty( 'key', 'rank' );

                // lock the rank input so users don't try and change it while the enum is being updated
                var oldConstant = input.isConstant;
                input.isConstant = function() { return true; };

                // update the max rank, then rebuild the input's enum list using the new metadata
                $scope.model.setMaxRank( cnRecordAddScope.record[property] ).then( function() {
                  var maxRank = $scope.model.metadata.columnList.rank.enumList.length;
                  input.enumList = $scope.model.metadata.columnList.rank.enumList;
                  input.enumList.push( {
                    value: maxRank + 1,
                    name: $filter( 'cnOrdinal' )( maxRank + 1 )
                  } );
                  input.enumList.unshift( { value: undefined, name: '(Select Rank)' } );

                  // if the rank is out of the new category's range then reset it
                  if( cnRecordAddScope.record.rank > maxRank + 1 ) cnRecordAddScope.record.rank = undefined;
                  input.isConstant = oldConstant;
                } );
              }
            };
          }, 500 );
        }
      };
    }
  ] );

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
  cenozo.providers.factory( 'CnStatusTypeAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
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
    'CnBaseViewFactory', 'CnModalConfirmFactory',
    function( CnBaseViewFactory, CnModalConfirmFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        this.onView = function( force ) {
          return this.$$onView( force ).then( function() {
            return self.parentModel.setMaxRank( self.record.category );
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStatusTypeModelFactory', [
    'CnBaseModelFactory', 'CnStatusTypeAddFactory', 'CnStatusTypeListFactory', 'CnStatusTypeViewFactory',
    'CnHttpFactory', '$state', '$filter',
    function( CnBaseModelFactory, CnStatusTypeAddFactory, CnStatusTypeListFactory, CnStatusTypeViewFactory,
              CnHttpFactory, $state, $filter ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStatusTypeAddFactory.instance( this );
        this.listModel = CnStatusTypeListFactory.instance( this );
        this.viewModel = CnStatusTypeViewFactory.instance( this, root );

        // sets the rank's max value based on a category
        this.setMaxRank = function( category ) {
          self.metadata.columnList.rank.enumList = [];
          return CnHttpFactory.instance( {
            path: 'status_type',
            data: {
              select: {
                column: {
                  column: 'MAX( status_type.rank )',
                  alias: 'max',
                  table_prefix: false
                }
              },
              modifier: {
                where: {
                  column: 'category',
                  operator: '=',
                  value: category
                }
              }
            },
            redirectOnError: true
          } ).query().then( function( response ) {
            if( 0 < response.data.length ) {
              self.metadata.columnList.rank.enumList = [];
              if( null !== response.data[0].max ) {
                for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ ) {
                  self.metadata.columnList.rank.enumList.push( {
                    value: rank,
                    name: $filter( 'cnOrdinal' )( rank )
                  } );
                }
              }
            }
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
