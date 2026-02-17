const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_base_element } = await import(`${CENOZO_URL}/js/element/base_element.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);

export class CN_aft_data_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "AFT data",
        plural: "AFT datas",
        posessive: "AFT data's",
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

export class CN_aft_data_view extends CN_action_view {
  /**
   * Extends parent method
   */
  constructor(model) {
    super(model);
    this.set_simple_mode(true);
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    const body_el = CN_base_element.html(`
      <div class="conatiner-fluid">
        <div name="record"></div>
      </div>
    `);

    // add the record details
    body_el.querySelector("[name=record]").append(super.create_body_element());

    return body_el;
  }
}
