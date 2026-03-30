import { CN_base_data_model, CN_base_data_test } from "./base_data.mjs"

const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_boolean } = await import(`${CENOZO_URL}/js/element/input/boolean.mjs`);

export class CN_premat_data_model extends CN_base_data_model {
  constructor() {
    super("pre-MAT");
  }
}

export class CN_premat_data_test extends CN_base_data_test {
  #record;
  #counting_form_input;
  #alphabet_form_input;

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    this.#record = await CN_api.get(this.get_api_path(), {
      select: { column: ["counting", "alphabet"] },
    });
  }

  /**
   * Extends parent method
   */
  set_disabled(disabled) {
    super.set_disabled(disabled);

    if (this.#counting_form_input) this.#counting_form_input.set_disabled(disabled);
    if (this.#alphabet_form_input) this.#alphabet_form_input.set_disabled(disabled);
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    this.#counting_form_input.set_value(this.#record.counting);
    this.#alphabet_form_input.set_value(this.#record.alphabet);
  }

  /**
   * Extends parent method
   */
  create_test_entry_element() {
    const test_entry_el = this.constructor.html('<div></div>');

    const counting_row_el = this.constructor.html('<div class="row mb-3"></div>');
    test_entry_el.append(counting_row_el);
    CN_element_label.create_element(counting_row_el, {
      for: "counting",
      value: "Counting",
      class: "col-sm-3",
    });
    this.#counting_form_input = new CN_input_boolean(counting_row_el, {
      id: "counting",
      class: "col-sm-9",
      on_change: async (form_input, valid) => {
        await CN_api.patch(this.get_api_path(), { counting: await form_input.get_value_for_record() });
      },
    });
    counting_row_el.append(this.#counting_form_input.get_element());

    const alphabet_row_el = this.constructor.html('<div class="row mb-3"></div>');
    test_entry_el.append(alphabet_row_el);
    CN_element_label.create_element(alphabet_row_el, {
      for: "alphabet",
      value: "Alphabet",
      class: "col-sm-3",
    });
    this.#alphabet_form_input = new CN_input_boolean(alphabet_row_el, {
      id: "alphabet",
      class: "col-sm-9",
      on_change: async (form_input, valid) => {
        await CN_api.patch(this.get_api_path(), { alphabet: await form_input.get_value_for_record() });
      },
    });
    alphabet_row_el.append(this.#alphabet_form_input.get_element());

    return test_entry_el;
  }
}
