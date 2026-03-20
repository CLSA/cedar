import { CN_base_data_model, CN_base_data_test } from "./base_data_model.mjs"
import { CN_word_model } from "./word.mjs"

const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_enum } = await import(`${CENOZO_URL}/js/element/input/enum.mjs`);
const { CN_input_typeahead } = await import(`${CENOZO_URL}/js/element/input/typeahead.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/element/modal/message.mjs`);

export class CN_rey_data_model extends CN_base_data_model {
  constructor() {
    super("REY");
  }
}

export class CN_rey_data_test extends CN_base_data_test {
  #base_language_id;
  #language_form_input;
  #intrusion_list = [];

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
      enum: {
        path: "language",
        modifier: {
          where: { column: "active", operator: "=", value: true },
          order: "language.name",
        },
      },
      on_change: async (form_input, valie) => {
        await CN_api.patch(this.get_api_path(), { language_id: form_input.get_value() });
        this.update_element();
      },
    });
  }

  /**
   * ADD DOCS
   */
  get_api_path() {
    return `rey_data/test_entry_id=${this.get_model().get_parent_model().get_identifier()}`;
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
  async on_load() {
    await super.on_load();

    // get additional data required for this data type
    const [record_response, language_response, variant_response, intrusion_response] = await Promise.all([
      // record
      CN_api.get(this.get_api_path()),

      // language
      CN_api.get("language/code=en"), // English is always the base language

      // variant
      CN_api.get("rey_data_variant", {
        // get the id, word and variant word
        select: {
          column: [
            "id",
            "language_id",
            "word",
            { table: "variant", column: "word", alias: "variant" },
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
    const intrusion_el = this.get_body_element().querySelector("[name=intrusion-list]");
    const language_id = this.#language_form_input.get_value();

    // update the word list
    Object.keys(this.#word_list).forEach(word_name => {
      const word = this.#word_list[word_name];

      word.element.querySelector("label").innerText = CN_common.uc_words(
        this.#base_language_id == language_id ?
        word_name :
        word.alt_name
      );

      // add the variants (of the currently selected language)
      const variants_el = word.element.querySelector("div[name=variants]");
      variants_el.innerHTML = "";
      word.variants.filter(variant => variant.language_id == language_id).forEach(variant => {
        const allowed = this.get_language_list().find(language => language.id == variant.language_id);
        variants_el.append(this.constructor.html(`
          <span class="mx-2">
            <input
              type="radio"
              id="variant_${variant.id}"
              name="${word_name}"
              ${allowed ? "" : 'style="cursor: not-allowed" disabled="true"'}
              ${word.value == variant.id ? "checked" : ""}
            ></input>
            <label
              for="variant_${variant.id}"
              ${allowed ? "" : 'style="cursor: not-allowed" class="text-black text-opacity-50"'}
            >${variant.variant}</label>
          </span>
        `));
        variants_el.querySelector(`#variant_${variant.id}`).addEventListener("click", async () => {
          await this.set_word_value(word_name, variant.id);
        });
      });

      // fill in the yes/no buttons
      if (true === word.value) {
        word.element.querySelector(`#${word_name}_yes`).checked = true;
      } else if (false === word.value) {
        word.element.querySelector(`#${word_name}_no`).checked = true;
      }
    });

    // build the intrusion list
    intrusion_el.innerHTML = "";

    if (0 == this.#intrusion_list.length) {
      if (!this.get_model().allow_edit()) {
        intrusion_el.innerHTML = '<div class="text-info">No intrusions have been entered.</div>';
      }
    } else {
      let buttons_el = null;
      this.#intrusion_list.forEach((intrusion, index) => {
        if (0 == index%4) {
          if (buttons_el) intrusion_el.append(buttons_el);
          buttons_el = this.constructor.html('<div class="row"></div>');
        }

        let btn_class = (
          "variant" == intrusion.word_type ? "warning" :
          "intrusion" == intrusion.word_type ? "success" :
          "danger" // "invalid" == intrusion.word_type
        );
        buttons_el.append(this.constructor.html(`
          <div class="pb-1 px-2 w-25">
            <button type="button" class="btn btn-${btn_class} w-100">
              ${CN_word_model.get_word_html(intrusion)}
            </button>
          </span>
        `));
      });

      intrusion_el.append(buttons_el);
    }
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = super.create_body_element();
    const test_entry_el = body_el.querySelector("div[name=test-entry]");

    const language_el = this.constructor.html('<div name="words" class="row mb-3"></div>');
    test_entry_el.append(language_el);
    CN_element_label.create_element(language_el, {
      for: "language_id",
      value: "Language",
      class: "col-sm-3",
    });
    this.#language_form_input.set_parent_element(language_el);
    language_el.append(this.#language_form_input.get_element());

    const words_el = this.constructor.html('<div name="words" class="container-fluid"></div>');
    test_entry_el.append(words_el);
    test_entry_el.append(this.constructor.html(`
      <div name="intrusions">
        <hr />
        <div name="intrusion-list" class="container-fluid mb-2"></div>
        <div name="intrusion-add" class="container-fluid">
          <div class="row mb-3"></div>
        </div>
        <hr />
      </div>
    `));

    // add the word list
    Object.keys(this.#word_list).forEach(word_name => {
      const word = this.#word_list[word_name];
      word.element = this.constructor.html('<div class="row"></div>');
      words_el.append(word.element);

      CN_element_label.create_element(word.element, {
        value: "Loading...",
        class: "col-sm-3",
      });

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

    // add the intrusion word entry
    const word_row_el = body_el.querySelector("div[name=intrusion-add] div.row");
    CN_element_label.create_element(word_row_el, {
      for: "new_word_id",
      value: "Enter Word",
      class: "col-sm-3",
    });
    const typeahead = CN_word_model.get_typeahead(this.get_language_list().map(language => language.id));
    typeahead.allow_new = true;
    typeahead.on_select = async (form_input, item) => {
      // process the selected item
      if (item.key) {
      } else {
        // remove en-/em-dashes
        const new_word = item.value.toLowerCase().replace(/[—–]/g, "-");
        if (new_word.match(/^-+$/)) {
          await (new CN_modal_message({
            title: "Placeholders Not Allowed",
            message: "You cannot use placeholders for the REY test.",
            header_class: "text-bg-danger",
          }).show());
        } else if (!CN_word_model.is_valid(new_word, this.get_language_list())) {
          await (new CN_modal_message({
            title: `
              The word you have provided is invalid.\n\n
              Please enter a word at least two characters long using only letters, single-quotes ('),
              dashes (-) and spaces, and which starts with at least one alphabetic letter.
            `,
            header_class: "text-bg-danger",
          }).show());
        }
      }
      
      // remove the value from the input
      form_input.undo_value(true);
    };
    CN_input_typeahead.create_element(word_row_el, {
      id: "new_word_id",
      class: "col-sm-9",
      typeahead: typeahead,
      postfix: (el) => {
        const btn_el = this.constructor.html(
          '<button type="button" class="btn btn-outline-primary ms-2">Mark Remaining As No</button>'
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
    body_el.querySelector("[name=intrusion-add]").append(word_row_el);

    return body_el;
  }
}
