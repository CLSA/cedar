const CN_session = (await import(`${CENOZO_URL}/js/session.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_action_list } = await import(`${CENOZO_URL}/js/element/action/list.mjs`);
import { CN_word_model } from "./word.mjs"

export class CN_compound_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "compound subword",
        plural: "compound subwords",
        posessive: "compound subword's",
      },
      columns: {
        rank: { title: "Rank", type: "rank" },
        subword: { column: "sub_word.word", title: "Subword" },
        sub_word_id: { type: "hidden" },
      },
      properties: {
        sub_word_id: {
          title: "Subword",
          type: "typeahead",
          typeahead: CN_word_model.get_typeahead(),
        },
        rank: { title: "Rank", type: "rank" },
      },
    });
  }
}

export class CN_compound_list extends CN_action_list {
  /**
   * Extend parent method to make clicking on a compound bring you to the word
   */
  async on_row_click(record) {
    if (this.is_choosing()) {
      await super.on_row_click(record);
    } else {
      await CN_session.navigate_to(`word/view/${record.sub_word_id}`);
    }
  }
}
