define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'setting', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'site',
        column: 'site_id',
        friendly: 'site'
      }
    },
    name: {
      singular: 'setting',
      plural: 'settings',
      possessive: 'setting\'s'
    },
    columnList: {
      site: {
        column: 'site.name',
        title: 'Site'
      },
      max_working_transcriptions: {
        title: 'Max Transcriptions',
        type: 'number',
        help: 'The maximum number of transcriptions a typist may work on at one time.'
      }
    },
    defaultOrder: {
      column: 'site',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    site: {
      column: 'site.name',
      title: 'Site',
      type: 'string',
      isConstant: true
    },
    max_working_transcriptions: {
      title: 'Max Working Transcriptions',
      type: 'string',
      format: 'integer',
      help: 'The maximum number of transcriptions a typist may work on at one time.  Note that typist ' +
            'may get beyond than this limit as a result of deferred transcriptions being returned to ' +
            'their working list.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSettingList', [
    'CnSettingModelFactory',
    function( CnSettingModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSettingModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSettingView', [
    'CnSettingModelFactory',
    function( CnSettingModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSettingModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSettingListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSettingViewFactory', [
    'CnBaseViewFactory', 'CnSession',
    function( CnBaseViewFactory, CnSession ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );

        // update the session data after patching settings
        this.afterPatch( function() { CnSession.updateData(); } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSettingModelFactory', [
    '$state', 'CnBaseModelFactory', 'CnSettingListFactory', 'CnSettingViewFactory',
    function( $state, CnBaseModelFactory, CnSettingListFactory, CnSettingViewFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnSettingListFactory.instance( this );
        this.viewModel = CnSettingViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
