import { CN_base_data_model, CN_base_data_test } from "./base_data.mjs"
import { CN_word_model } from "./word.mjs"

const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_enum } = await import(`${CENOZO_URL}/js/element/input/enum.mjs`);
const { CN_input_typeahead } = await import(`${CENOZO_URL}/js/element/input/typeahead.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/element/modal/input.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/element/modal/message.mjs`);

export class CN_rey_data_model extends CN_base_data_model {
  constructor() {
    super("REY");
  }
}

export class CN_rey_data_test extends CN_base_data_test {
  #base_language_id;
  #language_form_input;
  #new_entry_form_input;
  #intrusion_list = [];
  #sister_list = {};

  #word_list = {
    drum: { value: null, variants: [], alt_name: "tambour" },
    curtain: { value: null, variants: [], alt_name: "rideau" },
    bell: { value: null, variants: [], alt_name: "cloche" },
    coffee: { value: null, variants: [], alt_name: "café" },
    school: { value: null, variants: [], alt_name: "école" },
    parent: { value: null, variants: [], alt_name: "parent" },
    moon: { value: null, variants: [], alt_name: "lune" },
    garden: { value: null, variants: [], alt_name: "jardin" },
    hat: { value: null, variants: [], alt_name: "chapeau" },
    farmer: { value: null, variants: [], alt_name: "fermier" },
    nose: { value: null, variants: [], alt_name: "nez" },
    turkey: { value: null, variants: [], alt_name: "dinde" },
    colour: { value: null, variants: [], alt_name: "couleur" },
    house: { value: null, variants: [], alt_name: "maison" },
    river: { value: null, variants: [], alt_name: "rivière" },
  };

  constructor(parent_el, model) {
    super(parent_el, model);

    this.#language_form_input = new CN_input_enum(null, {
      id: "language_id",
      required: true,
      class: "col-sm-9",
      get_default: () => this.#base_language_id,
      enum: {
        path: "language",
        modifier: {
          where: { column: "active", operator: "=", value: true },
          order: "language.name",
        },
      },
      on_change: async (form_input, valie) => {
        await CN_api.patch(this.get_api_path(), { language_id: await form_input.get_value_for_record() });
        await this.get_model().get_parent_model().get_action().run(true);
        this.update_element();
      },
    });
  }

  /**
   * Converts a word to it's parent sister word (if one exists)
   * @param string word
   * @return string
   */
  convert_sister_word(word) {
    const matching_sister = this.#sister_list.find(sister => sister.word_list.includes(word));
    return matching_sister ? matching_sister.word : word;
  }

  /**
   * ADD DOCS
   */
  async set_word_value(word_name, value) {
    const data = {};

    this.#word_list[word_name].value = value;
    if (CN_common.is_integer(value)) {
      data[word_name] = null;
      data[`${word_name}_rey_data_variant_id`] = value;
    } else {
      data[word_name] = value ? 1 : 0;
      data[`${word_name}_rey_data_variant_id`] = null;
    }

    await CN_api.patch(this.get_api_path(), data);
  }

  /**
   * Extends parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);

    if (this.#language_form_input) this.#language_form_input.set_disabled(disabled);
    if (this.#new_entry_form_input) this.#new_entry_form_input.set_disabled(disabled);
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // get additional data required for this data type
    const [
      record_response,
      language_response,
      sister_response,
      variant_response,
      intrusion_response
    ] = await Promise.all([
      // record
      CN_api.get(this.get_api_path()),

      // language
      CN_api.get("language/code=en"), // English is always the base language

      // rey word sister words
      CN_api.get("word", {
        rey_words: 1,
        select: { column: ["id", "word", "sister_list"]},
      }),

      // variant
      CN_api.get("rey_data_variant", {
        // get the id, word and variant word
        select: {
          column: [
            "id",
            "language_id",
            "word",
            { table: "variant", column: "word", alias: "variant" },
            { table: "variant", column: "language_id", alias: "variant_language_id" },
          ]
        },
      }),

      // intrusion
      CN_api.get(`${this.get_api_path()}/word`, {
        select: {
          column: [
            { table: "word", column: "word" },
            { table: "language", column: "code" },
            "language_id",
            "word_type",
          ],
        },
      }),
    ]);

    this.#base_language_id = language_response.id;

    this.#language_form_input.set_value(record_response.language_id);

    this.#sister_list = sister_response.map(sister => {
      sister.word_list = sister.sister_list ? sister.sister_list.split(",") : [];
      return sister;
    });

    // add details from the record and variant responses to the word list
    Object.keys(this.#word_list).forEach(word_name => {
      const word = this.#word_list[word_name];
      word.value = (
        record_response[`${word_name}_rey_data_variant_id`] ?
        record_response[`${word_name}_rey_data_variant_id`] :
        record_response[word_name]
      );
      word.variants = variant_response.filter(variant => word_name == variant.word);
    });

    // get a list of all intrusions
    this.#intrusion_list = intrusion_response;
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    const words_el = this.get_body_element().querySelector("div[name=words]");
    const intrusions_el = this.get_body_element().querySelector("[name=intrusion-list]");
    const rey_language_id = Number(this.#language_form_input.get_value());

    // update the word list
    Object.keys(this.#word_list).forEach(word_name => {
      const word = this.#word_list[word_name];
      word.element.querySelector("label").innerText = CN_common.uc_words(
        this.#base_language_id == rey_language_id ?
        word_name :
        this.#word_list[word_name].alt_name
      );

      // add the variants (of the currently selected language)
      const variants_el = word.element.querySelector("div[name=variants]");
      variants_el.innerHTML = "";
      word.variants.filter(variant => variant.language_id == rey_language_id).forEach(variant => {
        const variant_el = this.constructor.html(`
          <span class="mx-2">
            <input
              type="radio"
              id="variant_${variant.id}"
              name="${word_name}"
              ${word.value == variant.id ? "checked" : ""}
            ></input>
            <label for="variant_${variant.id}">${variant.variant}</label>
          </span>
        `);

        // check that the variant is allowed (language is in the test-entry's language list)
        if (!this.get_language_list().some(l => l.id == variant.variant_language_id)) {
          variant_el.querySelector("label").classList.add("text-black", "text-opacity-50");
          this.constructor.set_disabled(variant_el.querySelector("input"), true);
        }
        variant_el.querySelector("input").addEventListener("click", async () => {
          await this.set_word_value(word_name, variant.id);
        });
        variants_el.append(variant_el);
      });

      // fill in the yes/no buttons
      if (true === word.value) {
        word.element.querySelector(`#${word_name}_yes`).checked = true;
      } else if (false === word.value) {
        word.element.querySelector(`#${word_name}_no`).checked = true;
      }
    });

    // build the intrusion list
    intrusions_el.innerHTML = "";

    if (0 == this.#intrusion_list.length) {
      if (!this.get_model().allow_edit()) {
        intrusions_el.append(this.constructor.html(
          '<div class="text-info">No intrusions have been entered.</div>'
        ));
      }
    } else {
      let buttons_el = null;
      this.#intrusion_list.forEach((intrusion, index) => {
        if (0 == index%4) {
          if (buttons_el) intrusions_el.append(buttons_el);
          buttons_el = this.constructor.html('<div class="row"></div>');
        }

        let btn_class = (
          "variant" == intrusion.word_type ? "warning" :
          "intrusion" == intrusion.word_type ? "success" :
          "danger" // "invalid" == intrusion.word_type
        );
        const button_div_el = this.constructor.html(`
          <div class="pb-1 px-2 w-25">
            <button type="button" class="btn btn-${btn_class} w-100">
              ${CN_word_model.get_word_html(intrusion)}
            </button>
          </div>
        `);
        button_div_el.querySelector("button").addEventListener("click", async () => {
          await CN_api.delete(`${this.get_api_path()}/word/${intrusion.id}`);
          await this.on_load();
          this.update_element();
        });

        buttons_el.append(button_div_el);
      });

      intrusions_el.append(buttons_el);
    }
  }

  /**
   * Extend parent method
   */
  create_test_entry_element() {
    const test_entry_el = this.constructor.html('<div></div>');

    const language_el = this.constructor.html('<div name="words" class="row mb-3"></div>');
    test_entry_el.append(language_el);
    CN_element_label.append(language_el, { for: "language_id", value: "Language", class: "col-sm-3" });
    this.#language_form_input.set_parent_element(language_el);
    language_el.append(this.#language_form_input.get_element());

    const words_el = this.constructor.html('<div name="words" class="container-fluid"></div>');
    test_entry_el.append(words_el);
    test_entry_el.append(this.constructor.html(`
      <div name="intrusions">
        <hr />
        <div name="intrusion-list" class="container-fluid mb-2"></div>
        <div name="word-add" class="container-fluid">
          <div class="row mb-3"></div>
        </div>
      </div>
    `));

    // add the word list
    Object.keys(this.#word_list).forEach(word_name => {
      const word = this.#word_list[word_name];
      word.element = this.constructor.html('<div class="row"></div>');
      words_el.append(word.element);
      CN_element_label.append(word.element, { value: "Loading...", class: "col-sm-3" });

      // add the yes/no radio buttons
      word.element.append(this.constructor.html(`
        <div name="yes-no" class="col-sm-4 text-center">
          <span class="mx-2">
            <input id="${word_name}_yes" name="${word_name}" type="radio"></input>
            <label for="${word_name}_yes" class="col-form-label form-check-label">Yes</label>
          </span>
          <span class="mx-2">
            <input id="${word_name}_no" name="${word_name}" type="radio"></input>
            <label for="${word_name}_no" class="col-form-label form-check-label">No</label>
          </span>
        </div>
      `));

      word.element.querySelector(`#${word_name}_yes`).addEventListener("click", async () => {
        await this.set_word_value(word_name, true);
      });
      word.element.querySelector(`#${word_name}_no`).addEventListener("click", async () => {
        await this.set_word_value(word_name, false);
      });

      // add the variants div
      word.element.append(this.constructor.html(
        '<div name="variants" class="col-sm-5 col-form-label">Loading...</div>'
      ));
    });

    // add word entry
    const word_row_el = test_entry_el.querySelector("div[name=word-add] div.row");
    CN_element_label.append(word_row_el, { for: "new_entry", value: "Enter Word", class: "col-sm-3" });
    const typeahead = CN_word_model.get_typeahead([
      { column: "word.language_id", operator: "IN", value: this.get_language_list().map(l => l.id) },
    ])
    typeahead.allow_new = true;
    typeahead.on_select = async (form_input, item) => {
      // ignore empty values
      if (!item.value) return;

      const rey_language_id = await this.#language_form_input.get_value_for_record();

      // process the selected item
      let input = null;
      if (item.key) {
        input = item;
      } else {
        // remove en-/em-dashes
        const new_entry = item.value.toLowerCase().replace(/[—–]/g, "-");
        if (new_entry.match(/^-+$/)) {
          await CN_modal_message.create_and_open({
            title: "Placeholders Not Allowed",
            message: "You cannot use placeholders for the REY test.",
            header_class: "text-bg-danger",
          });
          return;
        } else if (!CN_word_model.is_word_valid(new_entry, this.get_language_list())) {
          await CN_modal_message.create_and_open({
            title: `
              The word you have provided is invalid.\n\n
              Please enter a word at least two characters long using only letters, single-quotes ('),
              dashes (-) and spaces, and which starts with at least one alphabetic letter.
            `,
            header_class: "text-bg-danger",
          });
          return;
        }

        input = new_entry;
      }

      // determine if the input is wrapped in quotes
      let quoted = false;
      if (CN_common.is_string(input)) {
        // words enclosed in double-quotes are never modified
        const matches = input.toLowerCase().match(/^"(.*)"$/);
        if (null != matches) {
          input = matches[1];
          quoted = true;
        }
      }

      let new_input_list = [input];

      // if the word isn't quoted then split it up by spaces and convert sister words
      if (!quoted) {
        new_input_list = (CN_common.is_string(input) ? input : input.word)
          .split(/ +/)
          // make the list unqiue
          .filter((word_part, index, array) => array.indexOf(word_part) === index)
          // check if the word is a sister word and convert to the parent if so
          .map(word_part => this.convert_sister_word(word_part));

        // If the input was an object, there is only one word in the new list and it matches that object
        // then replace the list with the input word object
        if (CN_common.is_object(input) && 1 == new_input_list.length && input.word == new_input_list[0]) {
          new_input_list = [input];
        }
      }

      for (const new_input of new_input_list) {
        // convert sister words
        const word_str = this.convert_sister_word(CN_common.is_string(new_input) ? new_input : new_input.word);

        // 1) Check if the word is one of the REY words
        if (this.#word_list[word_str]) {
          await this.set_word_value(word_str, true);
          continue;
        }

        // 2) Check if the word is one of the REY variants
        let found = false;
        for (const word_name in this.#word_list) {
          const variant = this.#word_list[word_name].variants
            .filter(v => v.language_id == rey_language_id)
            .find(v => v.variant == word_str);
          if (variant) {
            // check that the variant is allowed (language is in the test-entry's language list)
            await (this.get_language_list().find(l => l.id == variant.variant_language_id) ?
              this.set_word_value(variant.word, variant.id) :
              CN_modal_message.create_and_open({
                title: "Variant Not Allowed",
                header_class: "text-bg-danger",
                message: `
                  You have selected the variant word "${word_str}" which is currently disabled
                  because the test-entry has not been identified as using the variant's language.\n\n
                  If you wish to select this variant you must enable the relevant language first.
                `,
              })
            );

            found = true;
            break;
          }
        }
        if (found) continue;

        // 3) Add the word as an intrusion

        // convert string inputs to a word with a language
        let new_intrusion = null;
        if (CN_common.is_string(new_input)) {
          const language_id = await CN_modal_input.create_and_open({
            title: "Confirm Word",
            message: `
              Please confirm that you wish to submit the word, "${new_input}",
              and that it is correctly spelled.
            `,
            input: {
              type: "enum",
              required: true,
              get_default: () => rey_language_id,
              enum: { values: this.get_language_list().map(l => ({ key: l.id, value: l.name })) },
            },
          });

          if (!language_id) continue; // if the user hits cancel the ignore the word
          new_intrusion = { language_id: language_id, word: new_input };
        } else {
          new_intrusion = new_input;
        }

        if (this.#intrusion_list.some(
          i => i.language_id == new_intrusion.language_id &&
          i.word == new_intrusion.word
        )) {
          await CN_modal_message.create_and_open({
            title: "Intrusion Already Exists",
            header_class: "text-bg-danger",
            message: `
              The intrusion you have submitted has already been added to this REY test and does
              need to be added multiple times.
            `,
          });
          continue;
        }

        try {
          this.#intrusion_list.push(
            await CN_api.post(`${this.get_api_path()}/word`, {
              add: undefined == new_intrusion.id ? new_intrusion : new_intrusion.id,
            })
          );
        } catch (error) {
          if (406 == error.response.status) {
            // the word is misspelled
            return CN_modal_message.create_and_open({
              title: "Misspelled Word",
              header_class: "text-bg-danger",
              message: "You have selected a misspelled word. This word cannot be used.",
            });
          } else {
            throw error;
          }
        }
      }

      // remove the value from the input
      form_input.undo_value(true);

      this.update_element();
    };
    this.#new_entry_form_input = new CN_input_typeahead(word_row_el, {
      id: "new_entry",
      class: "col-sm-9",
      typeahead: typeahead,
      postfix: (el) => {
        el.classList.add("flex-fill");
        const btn_el = this.constructor.html(
          '<button type="button" class="btn btn-outline-primary w-100 ms-2">Mark Remaining As No</button>'
        );
        btn_el.addEventListener("click", async () => {
          await Promise.all(
            Object.keys(this.#word_list).map(word_name => {
              const word = this.#word_list[word_name];
              if (null == word.value) return this.set_word_value(word_name, false);
            })
          );
          this.update_element();
        });
        el.append(btn_el);
      },
    });

    word_row_el.append(this.#new_entry_form_input.get_element());
    test_entry_el.querySelector("[name=word-add]").append(word_row_el);

    return test_entry_el;
  }
}
