import { CN_model_word } from "./word.mjs"

const { CN_action_add } = await import(`${CENOZO_URL}/js/action/add.mjs`);
const { CN_action_list } = await import(`${CENOZO_URL}/js/action/list.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_model_compound extends CN_base_model {
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
          typeahead: {}, // dynamic, determined in the add action classes below
        },
        rank: { title: "Rank", type: "rank" },
      },
    });
  }
}

export class CN_add_compound extends CN_action_add {
  /**
   * Extend parent method
   */
  async on_load() {
    await super.on_load();

    const parent_model = this.get_model().get_parent_model();
    const parent_word_id = parent_model.get_identifier();
    const parent_language_id = await parent_model.get_action().get_property_value_for_record("language_id");
    this.get_property("sub_word_id").form_input.set_config(
      "typeahead",
      CN_model_word.get_typeahead({
        modifier: {
          where: [
            { column: "word.id", operator: "!=", value: parent_word_id },
            { column: "word.language_id", operator: "=", value: parent_language_id },
            { bracket: true, open: true },
            { column: "IFNULL(aft, '')", operator: "!=", value: "invalid" },
            { column: "IFNULL(fas, '')", operator: "!=", value: "invalid", or: true },
            { bracket: true, open: false },
          ],
        },
      }),
    );
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    // add a button to add a new word
    const add_word_btn_el = this.constructor.html(
      '<button name="add-word" type="button" class="btn btn-light btn-outline-primary">Add Word</button>'
    );
    add_word_btn_el.addEventListener("click", async () => {
      CN_session.navigate_to("word/add");
    });
    footer_el.querySelector("div[name=left-btn-group]").append(add_word_btn_el);

    return footer_el;
  }
}

export class CN_list_compound extends CN_action_list {
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
