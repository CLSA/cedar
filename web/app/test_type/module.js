cenozoApp.defineModule({
  name: "test_type",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "name" },
      name: {
        singular: "test type",
        plural: "test types",
        possessive: "test type's",
      },
      columnList: {
        rank: { title: "Rank" },
        name: { title: "Name" },
        data_type: { title: "Data Type" },
        average_score: { title: "Average Score" },
        average_alt_score: { title: "Average Alt Score" },
      },
      defaultOrder: {
        column: "test_type.rank",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      rank: {
        title: "Rank",
        type: "string",
      },
      name: {
        title: "Name",
        type: "string",
      },
      data_type: {
        title: "Data Type",
        type: "string",
      },
      average_score: {
        title: "Average Score",
        type: "string",
        isConstant: true,
      },
      average_alt_score: {
        title: "Average Alternate Score",
        type: "string",
        isConstant: true,
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    module.addExtraOperation("list", {
      title: "Rescore All Test Entries",
      isIncluded: function ($state, model) {
        return model.canRescoreTestEntries();
      },
      isDisabled: function ($state, model) {
        return model.listModel.rescoreInProgress;
      },
      operation: async function ($state, model) {
        if (await model.listModel.rescoreTestEntries())
          await model.listModel.onList(true);
      },
    });

    module.addExtraOperation("view", {
      title: "Rescore Test Entries",
      isIncluded: function ($state, model) {
        return model.canRescoreTestEntries();
      },
      isDisabled: function ($state, model) {
        return model.viewModel.rescoreInProgress;
      },
      operation: async function ($state, model) {
        if (await model.viewModel.rescoreTestEntries())
          await model.viewModel.onView();
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnTestTypeListFactory", [
      "CnBaseListFactory",
      "CnHttpFactory",
      "CnModalConfirmFactory",
      function (CnBaseListFactory, CnHttpFactory, CnModalConfirmFactory) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);

          angular.extend(this, {
            rescoreInProgress: false,
            rescoreTestEntries: async function () {
              var response = await CnModalConfirmFactory.instance({
                title: "Re-Score All Test Entries",
                message:
                  "Are you sure you wish to re-score all test entries?\n\n" +
                  "This process is processor-intensive and may slow down the application for all " +
                  "users while scores are being re-calculated.  You should only continue if it is " +
                  "necessary for tests to be re-scored immediately.",
              }).show();

              if (response) {
                try {
                  this.rescoreInProgress = true;
                  response = await CnHttpFactory.instance({
                    path: "test_type?rescore=1",
                  }).count();
                } finally {
                  this.rescoreInProgress = false;
                }
              }

              return response;
            },
          });
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTestTypeViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      "CnModalConfirmFactory",
      function (CnBaseViewFactory, CnHttpFactory, CnModalConfirmFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "cohort");

          angular.extend(this, {
            rescoreInProgress: false,
            rescoreTestEntries: async function () {
              var response = await CnModalConfirmFactory.instance({
                title:
                  "Re-Score " +
                  this.record.data_type.toUpperCase() +
                  " Test Entries",
                message:
                  "Are you sure you wish to re-score all " +
                  this.record.name +
                  " test entries?\n\n" +
                  "This process is processor-intensive and may slow down the application for all " +
                  "users while scores are being re-calculated.  You should only continue if it is " +
                  "necessary for " +
                  this.record.name +
                  " tests to be re-scored immediately.",
              }).show();

              if (response) {
                try {
                  this.rescoreInProgress = true;
                  response = await CnHttpFactory.instance({
                    path: "test_type/" + this.record.id + "?rescore=1",
                  }).get();
                } finally {
                  this.rescoreInProgress = false;
                }
              }

              return response;
            },
          });
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTestTypeModelFactory", [
      "CnBaseModelFactory",
      "CnTestTypeListFactory",
      "CnTestTypeViewFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnBaseModelFactory,
        CnTestTypeListFactory,
        CnTestTypeViewFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);

          angular.extend(this, {
            listModel: CnTestTypeListFactory.instance(this),
            viewModel: CnTestTypeViewFactory.instance(this, root),
            canRescoreTestEntries: function () { return 2 < CnSession.role.tier; },
          });
        };

        return {
          root: new object(true),
          instance: function () { return new object(false); },
        };
      },
    ]);
  },
});
