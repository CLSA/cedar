cenozoApp.defineModule({
  name: "fas_data",
  models: "view",
  create: (module) => {
    cenozoApp.initDataModule(module, "FAS");

    /* ############################################################################################## */
    cenozo.providers.directive("cnFasDataView", [
      "CnFasDataModelFactory",
      "CnBaseRankDataViewDirectiveControllerFactory",
      function (
        CnFasDataModelFactory,
        CnBaseRankDataViewDirectiveControllerFactory
      ) {
        return {
          templateUrl: cenozoApp.getFileUrl("cedar", "view-rank-data.tpl.html"),
          restrict: "E",
          scope: { model: "=?", editEnabled: "=" },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnFasDataModelFactory.root;
            CnBaseRankDataViewDirectiveControllerFactory.construct($scope);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnFasDataViewFactory", [
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
    cenozo.providers.factory("CnFasDataModelFactory", [
      "CnBaseDataModelFactory",
      "CnFasDataViewFactory",
      function (CnBaseDataModelFactory, CnFasDataViewFactory) {
        var object = function (root, testEntryModel) {
          CnBaseDataModelFactory.construct(
            this,
            module,
            root,
            CnFasDataViewFactory
          );
          angular.extend(this, {
            testType: "fas",
            viewModel: CnFasDataViewFactory.instance(this, root),
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
