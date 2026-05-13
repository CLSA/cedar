const { CN_action_list } = await import(`${CENOZO_URL}/js/action/list.mjs`);
const { CN_model_base } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_model_homophone extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "homophone",
        plural: "homophones",
        posessive: "homophone's",
      },
      columns: {
        first_word: { column: "first_word.word", title: "First Word" },
        first_language: { column: "first_language.code", title: "First Language" },
        rank: { title: "Rank", type: "rank" },
        word: { column: "word.word", title: "Word" },
        language: { column: "language.code", title: "Language" },
        word_id: { type: "hidden" },
      },
    });
  }
}

export class CN_list_homophone extends CN_action_list {
  /**
   * Extend parent method to make clicking on a homophone bring you to the word
   */
  async on_row_click(record) {
    if (this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      await CN_session.navigate_to(`word/view/${record.word_id}`);
    }
  }
}
