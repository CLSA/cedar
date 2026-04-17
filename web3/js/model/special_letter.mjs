const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_special_letter_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "special letter",
        plural: "special letters",
        posessive: "special letter's",
      },
      columns: {
        letter: { title: "Letter" },
      },
      properties: {
        language: {
          meta: { table: "language", column: "name" },
          title: "Language",
          is_constant: () => true,
          is_hidden: (model) => "add" == model.get_action_name(),
        },
        letter: {
          title: "Letter",
          max_length: 1,
          regex: "[^a-zA-Z0-9]",
          help: `
            A letter used by this language which either falls outside of the regular alphabet (a to z) or
            contains an accent.
          `,
        },
      },
    });
  }
}
