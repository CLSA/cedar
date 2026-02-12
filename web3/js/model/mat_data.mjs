const CN_element = (await import(`${CENOZO_URL}/js/element.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);

export class CN_mat_data_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "MAT data",
        plural: "MAT datas",
        posessive: "MAT data's",
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

export class CN_mat_data_view extends CN_action_view {
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
