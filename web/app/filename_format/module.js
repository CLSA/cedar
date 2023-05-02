cenozoApp.defineModule({
  name: "filename_format",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "test_type",
          column: "test_type.name",
        },
      },
      name: {
        singular: "filename format",
        plural: "filename formats",
        possessive: "filename format's",
      },
      columnList: {
        format: { title: "Format" },
      },
      defaultOrder: {
        column: "filename_format.format",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      format: {
        title: "Format",
        type: "string",
        help: "A regular expression used to match recording filenames to the parent test type.",
      },
    });
  },
});
