cenozoApp.defineModule({
  name: "aft_data",
  models: "view",
  create: (module) => {
    cenozoApp.initDataModule(module, "AFT");

    /* ############################################################################################## */
    cenozo.providers.directive("cnAftDataView", [
      "CnAftDataModelFactory",
      "CnBaseRankDataViewDirectiveControllerFactory",
      function (
        CnAftDataModelFactory,
        CnBaseRankDataViewDirectiveControllerFactory
      ) {
        return {
          templateUrl: cenozoApp.getFileUrl("cedar", "view-rank-data.tpl.html"),
          restrict: "E",
          scope: { model: "=?", editEnabled: "=" },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnAftDataModelFactory.root;
            CnBaseRankDataViewDirectiveControllerFactory.construct($scope);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnAftDataViewFactory", [
      "CnBaseDataViewFactory",
      function (CnBaseDataViewFactory) {
        var object = function (parentModel, root) {
          CnBaseDataViewFactory.construct(this, parentModel, root);
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnAftDataModelFactory", [
      "CnBaseDataModelFactory",
      "CnAftDataViewFactory",
      function (CnBaseDataModelFactory, CnAftDataViewFactory) {
        var object = function (root, testEntryModel) {
          CnBaseDataModelFactory.construct(
            this,
            module,
            root,
            CnAftDataViewFactory
          );
          angular.extend(this, {
            testType: "aft",
            viewModel: CnAftDataViewFactory.instance(this, root),
            testEntryModel: testEntryModel,
          });
        };
        return {
          root: new object(true),
          instance: function (testEntryModel) {
            return new object(false, testEntryModel);
          },
        };
      },
    ]);
  },
});
