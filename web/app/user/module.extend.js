cenozoApp.extendModule({
  name: "user",
  create: (module) => {
    // extend the view factory
    cenozo.providers.decorator("CnUserViewFactory", [
      "$delegate",
      "CnSession",
      function ($delegate, CnSession) {
        var instance = $delegate.instance;
        $delegate.instance = function (parentModel, root) {
          var object = instance(parentModel, root);

          async function init() {
            // overrride cohort list's onDelete
            await object.deferred.promise;

            if (angular.isDefined(object.cohortModel)) {
              object.cohortModel.getChooseEnabled = function () {
                return (
                  3 <= CnSession.role.tier &&
                  object.cohortModel.$$getChooseEnabled()
                );
              };
            }
          }

          init();
          return object;
        };
        return $delegate;
      },
    ]);
  },
});
