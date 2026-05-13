import { CN_model_base_data, CN_test_base_data } from "./base_data.mjs"
import { CN_model_word } from "./word.mjs"

const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_string } = await import(`${CENOZO_URL}/js/input/string.mjs`);
const { CN_input_typeahead } = await import(`${CENOZO_URL}/js/input/typeahead.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/modal/input.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/modal/message.mjs`);

export class CN_model_base_rank_data extends CN_model_base_data {
  constructor(data_name) {
    super(data_name);

    if ("CN_model_base_rank_data" == this.constructor) {
      throw new Error("Abstract class CN_model_base_rank_data can't be instantiated.");
    }
  }
}

export class CN_test_base_rank_data extends CN_test_base_data {
  #entry_type;
  #entry_list;
  #new_entry_form_input;

  constructor(parent_el, model, entry_type) {
    super(parent_el, model);

    if ("CN_base_rank_data_test" == this.constructor) {
      throw new Error("Abstract class CN_base_rank_data_test can't be instantiated.");
    }

    this.#entry_type = entry_type;
  }

  /**
   * Extends parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);

    if (this.#new_entry_form_input) this.#new_entry_form_input.set_disabled(disabled);
    const new_entry_btn_el = this.#new_entry_form_input.get_element().querySelector("button");
    if (new_entry_btn_el) this.constructor.set_disabled(new_entry_btn_el, disabled);
    this.#entry_list.forEach(entry => {
      if (entry.action_btn_el) this.constructor.set_disabled(entry.action_btn_el, disabled);
      if (entry.entry_btn_el) this.constructor.set_disabled(entry.entry_btn_el, disabled);
    });
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // the columns to fetch depend on the entry type (word vs character)
    let column = ["id", "rank"];
    if ("word" == this.#entry_type) {
      column = [...column, ...[
        "word_type",
        { table: "word", column: "word" },
        { table: "language", column: "code" },
      ]];
    } else {
      column.push("value");
    }

    this.#entry_list = await CN_api.get(this.get_api_path(), {
      select: { column: column },
      modifier: { order: `${this.get_model().get_data_name()}_data.rank` },
    });
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    const entries_el = this.get_body_element().querySelector("div[name=entries]");
    entries_el.innerHTML = "";

    if (0 == this.#entry_list.length) {
      entries_el.append(this.constructor.html(
        '<div class="text-info">No words have been entered.</div>'
      ));
    } else {
      let buttons_el = null;
      this.#entry_list.forEach((entry, index) => {
        if (0 == index% ("word" == this.#entry_type ? 4 : 6)) {
          if (buttons_el) entries_el.append(buttons_el);
          buttons_el = this.constructor.html('<div class="row"></div>');
        }

        const button_div_el = this.constructor.html(
          "word" == this.#entry_type ?
          '<div class="pb-1 px-2 w-25 d-flex"></div>' :
          '<div class="pb-1 px-2 d-flex" style="width: 16.66% !important;"></div>'
        );
        buttons_el.append(button_div_el);

        const i_class = (
          "insert" == entry.action ? "box-arrow-in-up-right" :
          "replace" == entry.action ? "box-arrow-up-right" :
          "fullscreen" // no action
        );
        entry.action_btn_el = this.constructor.html(`
          <button type="button" name="action" class="btn btn-outline-primary me-1">
            <i class="bi bi-${i_class}"></i>
          </button>
        `);
        this.constructor.set_disabled(entry.action_btn_el, this.get_disabled());
        entry.action_btn_el.addEventListener("click", async () => {
          // remove the action from all entries and advance this entry to the next action
          this.#entry_list.forEach(e => {
            if (e.id == entry.id) {
              if (!e.action) {
                e.action = "insert";
              } else if ("insert" == e.action) {
                e.action = "replace";
              } else {
                e.action = null;
              }
            } else {
              e.action = null;
            }
          });
          this.update_element();
        });
        button_div_el.append(entry.action_btn_el);

        const btn_class = (
          "character" == this.#entry_type ? "outline-primary" :
          "variant" == entry.word_type ? "warning" :
          "intrusion" == entry.word_type ? "success" :
          "primary" == entry.word_type ? "outline-primary" :
          "invalid" == entry.word_type ? "danger" :
          "secondary" // "placeholder" == entry.word_type
        );
        entry.entry_btn_el = this.constructor.html(`
          <button type="button" name="entry" class="btn btn-${btn_class} w-100">
            ${
              "character" == this.#entry_type ?
              entry.value :
              entry.word ?
              CN_model_word.get_word_html(entry) :
              "(placeholder)"
            }
          </button>
        `);
        this.constructor.set_disabled(entry.entry_btn_el, this.get_disabled());
        entry.entry_btn_el.addEventListener("click", async () => {
          await CN_api.delete(`${this.get_api_path()}/${entry.id}`);
          await this.on_load();
          this.update_element();
        });
        button_div_el.append(entry.entry_btn_el);
      });

      entries_el.append(buttons_el);
    }
  }

  /**
   * Extends parent method
   */
  create_test_entry_element() {
    const test_entry_el = this.constructor.html(`
      <div>
        <div name="entries" class="container-fluid"></div>
        <hr />
        <div name="entry-add" class="container-fluid">
          <div class="row mb-3"></div>
        </div>
      </div>
    `);

    // add word entry
    const entry_row_el = test_entry_el.querySelector("div[name=entry-add] div.row");
    CN_element_label.append(entry_row_el, {
      for: "new_entry",
      value: `Enter ${CN_common.uc_words(this.#entry_type)}`,
      class: "col-sm-3",
    });

    if ("character" == this.#entry_type) {
      this.#new_entry_form_input = new CN_input_string(entry_row_el, {
        id: "new_entry",
        class: "col-sm-9",
        regex: "^[a-z0-9]$",
        on_input: async (form_input) => {
          let value = form_input.get_value();

          // immediately force 1 character max
          if (1 < value.length) value = value[0];

          // immediately force regex
          const re = new RegExp(form_input.get_config("regex"));
          if (!re.test(value)) value = "";

          form_input.set_value(value);
        },
        on_change: async (form_input, valid) => {
          const value = await form_input.get_value_for_record();

          // ignore empty values
          if (!value) return;

          await this.#submit_entry(value);
          form_input.undo_value(true);
        },
      });
    } else { // "word" == this.#entry_type
      const typeahead = CN_model_word.get_typeahead([
        { column: "word.language_id", operator: "IN", value: this.get_language_list().map(l => l.id) },
        { column: this.get_model().get_data_name(), operator: "!=", value: "invalid" },
      ]);
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
          const new_entry = item.value.toLowerCase().replace(/[—–]/g, "-").replace(/^"|"$/g, "").toLowerCase();
          if (!CN_model_word.is_word_valid(new_entry) && !new_entry.match(/^-+$/)) {
            await CN_modal_message.create_and_open({
              title: "Invalid Word",
              message: `
                The word you have provided is invalid.\n\n
                Please enter a word at least two characters long using only letters, single-quotes ('),
                dashes (-) and spaces, and which starts with at least one alphabetic letter.
              `,
              header_class: "text-bg-danger",
            });
            return;
          } else {
            const participant_language_id =
              this.get_model().get_parent_model().get_action().get_property_value("participant_language_id");
            const language_id = await CN_modal_input.create_and_open({
              title: "Confirm Word",
              message: `
                Please confirm that you wish to submit the word, "${new_entry}",
                and that it is correctly spelled.
              `,
              input: {
                type: "enum",
                required: true,
                get_default: () => participant_language_id,
                enum: { values: this.get_language_list().map(l => ({ key: l.id, value: l.name })) },
              },
            });

            if (!language_id) {
              await this.on_load();
              return; // if the user hits cancel the ignore the entry
            }

            input = { language_id: language_id, word: new_entry };
          }
        }

        await this.#submit_entry(input);
        form_input.undo_value(true);
      };
      this.#new_entry_form_input = new CN_input_typeahead(entry_row_el, {
        id: "new_entry",
        class: "col-sm-9",
        typeahead: typeahead,
        postfix: (el) => {
          el.classList.add("flex-fill");
          const btn_el = this.constructor.html(
            '<button type="button" class="btn btn-outline-primary w-100 ms-2">Add Placeholder</button>'
          );
          btn_el.addEventListener("click", async () => {
            await this.#submit_entry({ word_id: null });
            await this.on_load();
            this.update_element();
          });
          el.append(btn_el);
        },
      });
    }

    entry_row_el.append(this.#new_entry_form_input.get_element());
    test_entry_el.querySelector("[name=entry-add]").append(entry_row_el);


    return test_entry_el;
  }

  /**
   * ADD DOCS
   */
  async #submit_entry(entry) {
    // see if we're inserting or replacing a entry
    let action_entry = null;
    this.#entry_list.some(e => {
      if (e.action) {
        action_entry = e;
        return true;
      }
    });

    // insert the entry if an action entry has been selected
    const data = (
      "character" == this.#entry_type ?
      { value: entry } :
      entry.id ?
      { word_id: entry.id } :
      entry
    );
    if (action_entry) data.rank = action_entry.rank;

    await CN_api.post(this.get_api_path(), data);

    // delete the action entry if it is being replaced
    if (action_entry && "replace" == action_entry.action) {
      await CN_api.delete(`${this.get_api_path()}/${action_entry.id}`);
    }

    await this.on_load();
    this.update_element();
  }
}
