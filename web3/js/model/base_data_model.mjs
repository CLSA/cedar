const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);

const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_base_element } = await import(`${CENOZO_URL}/js/element/base_element.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_boolean } = await import(`${CENOZO_URL}/js/element/input/boolean.mjs`);
const { CN_input_enum } = await import(`${CENOZO_URL}/js/element/input/enum.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);

export class CN_base_data_model extends CN_base_model {
  constructor(data_name) {
    super({
      wording: {
        singular: `${data_name} data`,
        plural: `${data_name} data`,
        posessive: `${data_name} data's`,
      },
      properties: {
        language_id: {
          title: "Language",
          type: "enum",
          enum: {
            path: "language",
            modifier: {
              where: { column: "active", operator: "=", value: true },
              order: "language.name",
            },
          },
          on_change: async (form_input, valid) => {
            // run the default behaviour
            await form_input.get_action().on_property_change("language_id", valid);

            // then update the element to propagate the changed property
            if (valid) form_input.get_action().update_element();
          },
        },
        supplementary: {
          is_hidden: () => true,
          properties: {
            language_code: { meta: { table: "language", column: "code" }, is_hidden: () => true },
            test_entry_id: { is_hidden: () => true },
          }
        },
      },
    });
  }
}

export class CN_base_data_view extends CN_action_view {
  #language_list = [];
  #status_type_list = [];
  #sound_file_list = [];

  /**
   * Extends parent method
   */
  constructor(model) {
    super(model);
    this.set_simple_mode(true);
  }

  // Getter functions
  get_language_list() { return this.#language_list; }
  get_status_type_list() { return this.#status_type_list; }
  get_sound_file_list() { return this.#sound_file_list; }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // get the current language
    const test_entry_id = this.get_property_value("test_entry_id");

    // get additional data required for this data type
    const [language_r, status_type_r, sound_file_r] = await Promise.all([
      CN_api.get(`test_entry/${test_entry_id}/language`, {
        select: { column: "code" },
        modifier: { order: "code" },
      }),

      CN_api.get("status_type", {
        select: { column: ["category", "name"] },
        modifier: { order: ["category", "rank"] },
      }),

      CN_api.get(`test_entry/${test_entry_id}/sound_file`, {
        select: { column: ["id", "name", "url", "identifying"] },
      }),
    ]);

    // track which languages the test-entry uses
    this.#language_list = language_r.map(language => language.code);

    // get a list of all status types
    this.#status_type_list = status_type_r;

    // get a list of all sound files
    this.#sound_file_list = sound_file_r;
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    // clear out dynamic content
    const status_el = this.get_body_element().querySelector("[name=status]");
    const audio_el = this.get_body_element().querySelector("[name=audio]");
    status_el.innerHTML = "";
    audio_el.innerHTML = "";

    // build the status_type dropdowns
    if (0 < this.#status_type_list.length) {
      status_el.before(CN_base_element.html("<hr></hr>"));

      /* TODO: re-implement using CN_input_enum
      const dropdown_list = {};
      this.#status_type_list.forEach(status_type => {
        let el = dropdown_list[status_type.category];

        // create the dropdown if it hasn't been created yet
        if (!el) {
          el = CN_base_element.html('<div class="flex-fill m-2"></div>');
          el.append(CN_element_label.create({
            for: status_type.category,
            value: `${CN_common.uc_words(status_type.category)} Status`,
          }));
          el.append(CN_element.create_form_element("enum", {
            id: status_type.category,
            on_change: async (form_input, valid) => {
              // TODO: implement using status_type and control_el.value
            },
          }));
          status_el.append(el);
          dropdown_list[status_type.category] = el;
        }

        // add the status to the dropdown
        el.querySelector(".form-select").append(
          CN_base_element.html(`<option value="${status_type.id}">${status_type.name}</option>`)
        );
      });
      */
    }

    // build the sound_file dropdowns
    if (0 == this.#sound_file_list.length) {
      audio_el.innerHTML = "There are no sound files available for this test.";
    } else {
      audio_el.append(CN_base_element.html(`
        <div class="d-flex justify-content-center pb-2">
          <div class="mx-2 fst-italic"><span class="fw-bold">Play/Pause:</span> Ctrl⋅Shift⋅L</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Backward:</span> Ctrl⋅Shift⋅&lt;</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Forward:</span> Ctrl⋅Shift⋅&gt;</div>
        </div>
      `));

      /* TODO: reimplement using CN_input_boolean
      this.#sound_file_list.forEach(sound_file => {
        const sound_file_id = `sound_file_${sound_file.id}`;
        const row_el = CN_base_element.html('<div class="row pb-2"></div>');
        const label_el = CN_element_label.create({
          for: sound_file_id,
          value: CN_common.uc_words(sound_file.name),
        });
        label_el.classList.add("col-sm-2");
        row_el.append(label_el);
        row_el.append(CN_base_element.html(
          `<audio class="col-sm-7" type="audio/wav" src="${sound_file.url}" controls=""></audio>`
        ));
        const identifying_el = CN_element.create_form_element("boolean", {
          id: sound_file_id,
          on_change: async (form_input, valid) => {
            // TODO
          },
        });
        identifying_el.classList.add("col-sm-2");
        identifying_el.querySelector("[value='']").innerHTML = "(select identifying)";
        identifying_el.querySelector("[value='1']").innerHTML = "Identifying";
        identifying_el.querySelector("[value='0']").innerHTML =  "Not Identifying";

        identifying_el.querySelector(`[value='${
          null == sound_file.identifying ? "" :
          sound_file.identifying ? "1" :
          "0"
        }']`).selected = true;
        row_el.append(identifying_el);
        audio_el.append(row_el);
      });
      */
    }
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    const body_el = CN_base_element.html(`
      <div class="conatiner-fluid">
        <div name="record"></div>
        <div name="test_entry"></div>
        <div name="status" class="d-flex mx-1"></div>
        <hr />
        <div name="audio" class="mb-2"></div>
      </div>
    `);

    // add the record details
    body_el.querySelector("[name=record]").append(super.create_body_element());

    return body_el;
  }
}
