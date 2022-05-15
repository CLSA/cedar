cenozoApp.defineModule({
  name: "special_letter",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "special letter",
        plural: "special letters",
        possessive: "special letter's",
      },
      columnList: {
        language: {
          column: "language.name",
          title: "Language",
        },
        letter: {
          title: "Letter",
        },
      },
      defaultOrder: {
        column: "special_letter.letter",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      language: {
        column: "language.name",
        title: "Language",
        type: "string",
        isConstant: true,
      },
      letter: {
        title: "Letter",
        type: "string",
        isConstant: true,
      },
    });
  },
});
