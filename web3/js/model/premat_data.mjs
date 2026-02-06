const CN_api = (await import(`${CENOZO_URL}/js/api.mjs`)).default;
const CN_element = (await import(`${CENOZO_URL}/js/element.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);
import { CN_word_model } from "./word.mjs"

export class CN_premat_data_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "pre-MAT data",
        plural: "pre-MAT datas",
        posessive: "pre-MAT data's",
      },
      properties: {
        supplementary: {
          is_hidden: () => true,
          properties: {
            test_entry_id: { is_hidden: () => true },
          }
        },
      },
    });
  }
}

export class CN_premat_data_view extends CN_action_view {
  #word_list = [];
  #intrusion_list = [];

  /**
   * Extends parent method
   */
  constructor(model) {
    super(model);
    this.set_simple_mode(true);
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // get the current test_entry_id
    const test_entry_id = this.get_property_value("test_entry_id");
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    const body_el = CN_element.create(`
      <div class="conatiner-fluid">
        <div name="record"></div>
      </div>
    `);

    // add the record details
    body_el.querySelector("[name=record]").append(super.create_body_element());

    return body_el;
  }
}
