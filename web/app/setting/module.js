cenozoApp.defineModule({
  name: "setting",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "site",
          column: "site_id",
          friendly: "site",
        },
      },
      name: {
        singular: "setting",
        plural: "settings",
        possessive: "setting's",
      },
      columnList: {
        site: {
          column: "site.name",
          title: "Site",
        },
        max_working_transcriptions: {
          title: "Max Transcriptions",
          type: "number",
          help: "The maximum number of transcriptions a typist may work on at one time.",
        },
      },
      defaultOrder: {
        column: "site",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      site: {
        column: "site.name",
        title: "Site",
        type: "string",
        isConstant: true,
      },
      max_working_transcriptions: {
        title: "Max Working Transcriptions",
        type: "string",
        format: "integer",
        help:
          "The maximum number of transcriptions a typist may work on at one time.  Note that typist " +
          "may get beyond than this limit as a result of deferred transcriptions being returned to " +
          "their working list.",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnSettingViewFactory", [
      "CnBaseViewFactory",
      "CnSession",
      function (CnBaseViewFactory, CnSession) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          // update the session data after patching settings
          this.afterPatch(function () {
            CnSession.updateData();
          });
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);
  },
});
