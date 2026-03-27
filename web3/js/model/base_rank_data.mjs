import { CN_base_data_model, CN_base_data_test } from "./base_data.mjs"
import { CN_word_model } from "./word.mjs"

const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_typeahead } = await import(`${CENOZO_URL}/js/element/input/typeahead.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/element/modal/input.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/element/modal/message.mjs`);

export class CN_base_rank_data_model extends CN_base_data_model {
  constructor(data_name) {
    super(data_name);

    if ("CN_base_rank_data_model" == this.constructor) {
      throw new Error("Abstract class CN_base_rank_data_model can't be instantiated.");
    }
  }
}

export class CN_base_rank_data_test extends CN_base_data_test {
  #word_list;

  constructor(parent_el, model) {
    super(parent_el, model);

    if ("CN_base_rank_data_test" == this.constructor) {
      throw new Error("Abstract class CN_base_rank_data_test can't be instantiated.");
    }
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    this.#word_list = await CN_api.get(this.get_api_path(), {
      select: { column: [
        "id",
        "rank",
        "word_type",
        { table: "word", column: "word" },
        { table: "language", column: "code" },
      ] },
      modifier: { order: `${this.get_model().get_data_name()}_data.rank` },
    });
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    const words_el = this.get_body_element().querySelector("div[name=words]");
    words_el.innerHTML = "";

    if (0 == this.#word_list.length) {
      words_el.append(this.constructor.html(
        '<div class="text-info">No words have been entered.</div>'
      ));
    } else {
      let buttons_el = null;
      this.#word_list.forEach((word, index) => {
        if (0 == index%4) {
          if (buttons_el) words_el.append(buttons_el);
          buttons_el = this.constructor.html('<div class="row"></div>');
        }

        const button_div_el = this.constructor.html('<div class="pb-1 px-2 w-25 d-flex"></div>');
        buttons_el.append(button_div_el);

        const i_class = (
          "insert" == word.action ? "box-arrow-in-up-right" :
          "replace" == word.action ? "box-arrow-up-right" :
          "fullscreen" // no action
        );
        const action_btn_el = this.constructor.html(`
          <button type="button" name="action" class="btn btn-outline-primary me-1">
            <i class="bi bi-${i_class}"></i>
          </button>
        `);
        action_btn_el.addEventListener("click", async () => {
          // remove the action from all words and advance this word to the next action
          this.#word_list.forEach(w => {
            if (w.id == word.id) {
              if (!w.action) {
                w.action = "insert";
              } else if ("insert" == w.action) {
                w.action = "replace";
              } else {
                w.action = null;
              }
            } else {
              w.action = null;
            }
          });
          this.update_element();
        });
        button_div_el.append(action_btn_el);

        const btn_class = (
          "variant" == word.word_type ? "warning" :
          "intrusion" == word.word_type ? "success" :
          "primary" == word.word_type ? "outline-primary" :
          "invalid" == word.word_type ? "danger" :
          "secondary" // "placeholder" == word.word_type
        );
        const word_btn_el = this.constructor.html(`
          <button type="button" name="word" class="btn btn-${btn_class} w-100">
            ${word.word ? CN_word_model.get_word_html(word) : "(placeholder)"}
          </button>
        `);
        word_btn_el.addEventListener("click", async () => {
          await CN_api.delete(`${this.get_api_path()}/${word.id}`);
          await this.on_load();
          this.update_element();
        });
        button_div_el.append(word_btn_el);
      });

      words_el.append(buttons_el);
    }
  }

  /**
   * Extends parent method
   */
  create_test_entry_element() {
    const test_entry_el = this.constructor.html(`
      <div>
        <div name="words" class="container-fluid"></div>
        <hr />
        <div name="word-add" class="container-fluid">
          <div class="row mb-3"></div>
        </div>
      </div>
    `);

    // add word entry
    const word_row_el = test_entry_el.querySelector("div[name=word-add] div.row");
    CN_element_label.create_element(word_row_el, {
      for: "new_word_id",
      value: "Enter Word",
      class: "col-sm-3",
    });
    const typeahead = CN_word_model.get_typeahead(this.get_language_list().map(l => l.id));
    typeahead.allow_new = true;
    typeahead.on_select = async (form_input, item) => {
      // ignore empty values
      if (!item.value) return;

      // process the selected item
      let input = null;
      if (item.key) {
        input = item;
      } else {
        // remove en-/em-dashes, and remove case and double quotes if they are found at the start/end
        const new_word = item.value.toLowerCase().replace(/[—–]/g, "-").replace(/^"|"$/g, "").toLowerCase();
        if (!CN_word_model.is_word_valid(new_word) && !new_word.match(/^-+$/)) {
          await (new CN_modal_message({
            title: "Invalid Word",
            message: `
              The word you have provided is invalid.\n\n
              Please enter a word at least two characters long using only letters, single-quotes ('),
              dashes (-) and spaces, and which starts with at least one alphabetic letter.
            `,
            header_class: "text-bg-danger",
          }).open());
          return;
        } else {
          const participant_language_id =
            this.get_model().get_parent_model().get_action().get_property_value("participant_language_id");
          const language_id = await (new CN_modal_input({
            title: "Confirm Word",
            message: `
              Please confirm that you wish to submit the word, "${new_word}",
              and that it is correctly spelled.
            `,
            input: {
              type: "enum",
              required: true,
              get_default: () => participant_language_id,
              enum: { values: this.get_language_list().map(l => ({ key: l.id, value: l.name })) },
            },
          })).open();

          if (!language_id) {
            await this.on_load();
            return; // if the user hits cancel the ignore the word
          }

          input = { language_id: language_id, word: new_word };
        }
      }

      // see if we're inserting or replacing a word
      let action_word = null;
      this.#word_list.some(w => {
        if (w.action) {
          action_word = w;
          return true;
        }
      });

      // insert the word if an action word has been selected
      const data = (
        input.id ?
        { word_id: input.id } :
        input
      );
      if (action_word) data.rank = action_word.rank;

      await CN_api.post(this.get_api_path(), data);

      // delete the action word if it is being replaced
      if (action_word && "replace" == action_word.action) {
        await CN_api.delete(`${this.get_api_path()}/${action_word.id}`);
      }

      form_input.undo_value(true);
      await this.on_load();
      this.update_element();
    };
    CN_input_typeahead.create_element(word_row_el, {
      id: "new_word_id",
      class: "col-sm-9",
      typeahead: typeahead,
      postfix: (el) => {
        el.classList.add("flex-fill");
        const btn_el = this.constructor.html(
          '<button type="button" class="btn btn-outline-primary w-100 ms-2">Add Placeholder</button>'
        );
        btn_el.addEventListener("click", async () => {
          await CN_api.post(this.get_api_path(), { word_id: null });
          await this.on_load();
          this.update_element();
        });
        el.append(btn_el);
      },
    });
    test_entry_el.querySelector("[name=word-add]").append(word_row_el);


    return test_entry_el;
  }
}
