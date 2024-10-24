cenozoApp.defineModule({
  name: "status_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "word",
          column: "word",
        },
      },
      name: {
        singular: "status type",
        plural: "status types",
        possessive: "status type's",
      },
      columnList: {
        category: { title: "Category" },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
      },
      defaultOrder: {
        column: "category",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      category: {
        title: "Category",
        type: "enum",
        isConstant: "view",
      },
      rank: {
        title: "Rank",
        type: "rank",
      },
      name: {
        title: "Name",
        type: "string",
        format: "identifier",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnStatusTypeAdd", [
      "CnStatusTypeModelFactory",
      "$filter",
      function (CnStatusTypeModelFactory, $filter) {
        return {
          templateUrl: module.getFileUrl("add.tpl.html"),
          restrict: "E",
          scope: { model: "=?" },
          controller: function ($scope) {
            if (angular.isUndefined($scope.model))
              $scope.model = CnStatusTypeModelFactory.root;

            var cnRecordAddScope = null;
            $scope.$on(
              "cnRecordAdd ready",
              function (event, data) {
                cnRecordAddScope = data;

                // change the max rank based on the currently selected category
                cnRecordAddScope.baseCheckFn = cnRecordAddScope.check;
                cnRecordAddScope.check = async function (property) {
                  // run the original check function first
                  cnRecordAddScope.baseCheckFn(property);
                  if ("category" == property) {
                    var input = cnRecordAddScope.dataArray
                      .findByProperty("title", "")
                      .inputArray.findByProperty("key", "rank");

                    // lock the rank input so users don't try and change it while the enum is being updated
                    var oldConstant = input.isConstant;
                    input.isConstant = function () {
                      return true;
                    };

                    // update the max rank, then rebuild the input's enum list using the new metadata
                    await $scope.model.setMaxRank(
                      cnRecordAddScope.record[property]
                    );

                    var maxRank =
                      $scope.model.metadata.columnList.rank.enumList.length;
                    input.enumList =
                      $scope.model.metadata.columnList.rank.enumList;
                    input.enumList.push({
                      value: maxRank + 1,
                      name: $filter("cnOrdinal")(maxRank + 1),
                    });
                    input.enumList.unshift({
                      value: undefined,
                      name: "(Select Rank)",
                    });

                    // if the rank is out of the new category's range then reset it
                    if (cnRecordAddScope.record.rank > maxRank + 1)
                      cnRecordAddScope.record.rank = undefined;
                    input.isConstant = oldConstant;
                  }
                };
              },
              500
            );
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnStatusTypeViewFactory", [
      "CnBaseViewFactory",
      "CnModalConfirmFactory",
      function (CnBaseViewFactory, CnModalConfirmFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          this.onView = async function (force) {
            await this.$$onView(force);
            await this.parentModel.setMaxRank(this.record.category);
          };
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnStatusTypeModelFactory", [
      "CnBaseModelFactory",
      "CnStatusTypeAddFactory",
      "CnStatusTypeListFactory",
      "CnStatusTypeViewFactory",
      "CnHttpFactory",
      "$state",
      "$filter",
      function (
        CnBaseModelFactory,
        CnStatusTypeAddFactory,
        CnStatusTypeListFactory,
        CnStatusTypeViewFactory,
        CnHttpFactory,
        $state,
        $filter
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnStatusTypeAddFactory.instance(this);
          this.listModel = CnStatusTypeListFactory.instance(this);
          this.viewModel = CnStatusTypeViewFactory.instance(this, root);

          // sets the rank's max value based on a category
          this.setMaxRank = async function (category) {
            var response = await CnHttpFactory.instance({
              path: "status_type",
              data: {
                select: {
                  column: {
                    column: "MAX( status_type.rank )",
                    alias: "max",
                    table_prefix: false,
                  },
                },
                modifier: {
                  where: {
                    column: "category",
                    operator: "=",
                    value: category,
                  },
                },
              },
              redirectOnError: true,
            }).query();

            this.metadata.columnList.rank.enumList = [];
            if (0 < response.data.length && null !== response.data[0].max) {
              for (
                var rank = 1;
                rank <= parseInt(response.data[0].max);
                rank++
              ) {
                this.metadata.columnList.rank.enumList.push({
                  value: rank,
                  name: $filter("cnOrdinal")(rank),
                });
              }
            }
          };
        };

        return {
          root: new object(true),
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
