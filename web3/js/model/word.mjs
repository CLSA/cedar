const CN_api = (await import(`${CENOZO_URL}/js/api.mjs`)).default;
const CN_session = (await import(`${CENOZO_URL}/js/session.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);

export class CN_word_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "word",
        plural: "words",
        posessive: "word's",
      },
      columns: {
        language: { column: "language.name", title: "Language" },
        word: { column: "word.word", title: "Word" },
        animal_code: { column: "word.animal_code", title: "Animal Code" },
        sister_word: { column: "sister_word.word", title: "Parent Sister" },
        compound_count: { title: "Compounds", type: "number", table_prefix: false },
        misspelled: { column: "word.misspelled", title: "Misspelled", type: "boolean" },
        aft: { column: "word.aft", title: "AFT Type" },
        fas: { column: "word.fas", title: "FAS Type" },
        aft_total: { column: "word_test_type_total.aft_total", title: "#AFT", type: "number" },
        fas_total: { column: "word_test_type_total.fas_total", title: "#FAS", type: "number" },
        rey_total: { column: "word_test_type_total.rey_total", title: "#REY", type: "number" },
        update_timestamp: { column: "word.update_timestamp", title: "Timestamp", type: "datetime" },
      },
      properties: {
        language_id: {
          title: "Language",
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
          is_constant: () => true,
        },
        word: { title: "Word", format: "identifier", is_constant: () => true },
        animal_code: {
          title: "Animal Code",
          // regex is exactly 7 integers >= 0 delimited by a period (.)
          regex: "^(([0-9]|[1-9][0-9]+).){6}([0-9]|[1-9][0-9]+)$",
        },
        sister_word_id: {
          title: "Parent Sister Word",
          type: "typeahead",
          typeahead: CN_word_model.get_typeahead(),
          is_constant: (model) => "view" == model.get_action_name(),
          // TODO: implement based on old compoundWordCount value
        },
        misspelled: { title: "Misspelled", type: "boolean" },
        aft: { title: "AFT Type", type: "enum" },
        fas: { title: "FAS Type", type: "enum" },
        description: { title: "Description", type: "text" },
      },
    });
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @return object
   * @static
   */
  static get_typeahead() {
    return {
      get_list: async (value) => {
        return await CN_api.get("word", {
          select: {
            column: [
              { column: "id", alias: "key" },
              { column: 'CONCAT( word.word, " [", language.code, "]" )', alias: "value" },
            ],
          },
          modifier: {
            where: [
              { column: "word.fas", operator: "!=", value: "invalid" },
              { column: "word.sister_word_id", operator: "=", value: null },
            ],
            order: 'word.word',
          },
        });
      },
    };
  }
}

// TODO: implement v2 customizations
