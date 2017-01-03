define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_type_filename_format', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_type',
        column: 'test_type.name'
      }
    },
    name: {
      singular: 'test type filename format',
      plural: 'test type filename formats',
      possessive: 'test type filename format\'s',
      pluralPossessive: 'test type filename formats\''
    },
    columnList: {
      format: { title: 'Format' },
    },
    defaultOrder: {
      column: 'test_type_filename_format.format',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    format: {
      title: 'Format',
      type: 'string',
      help: 'A regular expression used to match recording filenames to the parent test type.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestTypeFilenameFormatAdd', [
    'CnTestTypeFilenameFormatModelFactory',
    function( CnTestTypeFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestTypeFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestTypeFilenameFormatList', [
    'CnTestTypeFilenameFormatModelFactory',
    function( CnTestTypeFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestTypeFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestTypeFilenameFormatView', [
    'CnTestTypeFilenameFormatModelFactory',
    function( CnTestTypeFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestTypeFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeFilenameFormatAddFactory', [
    'CnBaseAddFactory', 'CnModalMessageFactory',
    function( CnBaseAddFactory, CnModalMessageFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeFilenameFormatListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeFilenameFormatViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeFilenameFormatModelFactory', [
    'CnBaseModelFactory',
    'CnTestTypeFilenameFormatAddFactory',
    'CnTestTypeFilenameFormatListFactory',
    'CnTestTypeFilenameFormatViewFactory',
    function( CnBaseModelFactory,
              CnTestTypeFilenameFormatAddFactory,
              CnTestTypeFilenameFormatListFactory,
              CnTestTypeFilenameFormatViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnTestTypeFilenameFormatAddFactory.instance( this );
        this.listModel = CnTestTypeFilenameFormatListFactory.instance( this );
        this.viewModel = CnTestTypeFilenameFormatViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
