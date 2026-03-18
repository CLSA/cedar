const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_base_action } = await import(`${CENOZO_URL}/js/element/action/base_action.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_audio_url } = await import(`${CENOZO_URL}/js/element/input/audio_url.mjs`);
const { CN_input_boolean } = await import(`${CENOZO_URL}/js/element/input/boolean.mjs`);
const { CN_input_enum } = await import(`${CENOZO_URL}/js/element/input/enum.mjs`);
const { CN_input_string } = await import(`${CENOZO_URL}/js/element/input/string.mjs`);

export class CN_base_data_model extends CN_base_model {
  constructor(data_name) {
    super({
      wording: {
        singular: `${data_name} data`,
        plural: `${data_name} data`,
        posessive: `${data_name} data's`,
      },
    });
  }
}

export class CN_base_data_test extends CN_base_action {
  #language_list = [];
  #status_type_list = [];
  #sound_file_list = [];
  #on_keydown;

  /**
   * Extends parent method
   */
  constructor(parent_el, model) {
    super("test", parent_el, model);
    this.set_simple_mode(true);

    this.#on_keydown = (event) => {
      if (event.shiftKey && event.ctrlKey) {
        const sound_file = this.#sound_file_list.find(sf => sf.active);
        if (sound_file && sound_file.form_input) {
          const sound_file_el = sound_file.form_input.get_control_element();

          if ("L" == event.key) {
            // play/pause toggle
            event.stopPropagation();
            if (sound_file_el.paused) {
              sound_file_el.play();
            } else {
              sound_file_el.pause();
            }
          } else if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
            // prev/next recording
            event.stopPropagation();

            const reverse = "ArrowLeft" == event.key;
            const active_index = this.#sound_file_list.map(sf => sf.active).indexOf(true);
            if (
              (reverse && 0 < active_index) ||
              (!reverse && (this.#sound_file_list.length-1) > active_index)
            ) {
              this.#sound_file_list.forEach((sf, index) => {
                sf.active = index == (active_index + (reverse ? -1 : 1));

                // update the audio elements based on which is active
                if (sf.active) {
                  sf.label_el.classList.add("text-bg-info");
                } else {
                  sf.label_el.classList.remove("text-bg-info");
                  sf.form_input.get_control_element().pause();
                }
              });
            }
          } else if ("<" == event.key) {
            // backward 10s
            event.stopPropagation();
            sound_file_el.currentTime -= 10;
          } else if (">" == event.key) {
            // forward 10s
            event.stopPropagation();
            sound_file_el.currentTime += 10;
          }
        }
      }
    };
  }

  // getters
  get_language_list() { return this.#language_list; }

  /**
   * Extends parent method
   */
  async on_dom_add() {
    await super.on_dom_add();

    // add the sound file controls
    document.querySelector("body").addEventListener("keydown", this.#on_keydown);
  }

  /**
   * Extends parent method
   */
  async on_dom_remove() {
    await super.on_dom_remove();

    // remove the sound file controls
    document.querySelector("body").removeEventListener("keydown", this.#on_keydown);
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // get the current language
    const test_entry_id = this.get_model().get_parent_model().get_identifier();

    // get additional data required for this data type
    const [
      language_response,
      status_type_response,
      sound_file_response
    ] = await Promise.all([
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
        modifier: { order: "name" },
      }),
    ]);

    // track which languages the test-entry uses
    this.#language_list = language_response.map(language => language.code);

    // get a list of all status types
    this.#status_type_list = status_type_response;

    // get a list of all sound files
    this.#sound_file_list = sound_file_response;
    this.#sound_file_list.forEach((sound_file, index) => sound_file.active = 0 == index);
  }

  /**
   * Extends parent method
   */
  update_element() {
    // clear out dynamic content
    const status_el = this.get_body_element().querySelector("[name=status]");
    const audio_el = this.get_body_element().querySelector("[name=audio]");
    status_el.innerHTML = "";
    audio_el.innerHTML = "";

    // add the status_type dropdowns
    if (0 < this.#status_type_list.length) {
      const parent_action = this.get_model().get_parent_model().get_action();

      // create an enum for all status types
      const categories = {};
      this.#status_type_list.forEach(status_type => {
        if (!categories[status_type.category]) {
          categories[status_type.category] = {
            enum_list: [],
            enum_form_input: null,
            string_form_input: null,
            is_other_selected: function() {
              const status = this.enum_list.find(obj => obj.key == this.enum_form_input.get_value());
              return status && status.value.match(/Other/);
            },
          };
        }
        categories[status_type.category].enum_list.push({ key: status_type.id, value: status_type.name });
      });

      status_el.innerHTML = "";
      for (const cat_name in categories) {
        const category = categories[cat_name];
        const id = `${cat_name}_status_type_id`;
        const other_id = `${cat_name}_status_type_other`;
        const other_value = parent_action.get_property_value(other_id);

        const dropdown_el = this.constructor.html('<div class="w-100 m-2"></div>');
        CN_element_label.create_element(dropdown_el, {
          for: cat_name,
          value: `${CN_common.uc_words(cat_name)} Status`,
        });

        category.enum_form_input = new CN_input_enum(dropdown_el, {
          id: id,
          get_default: () => parent_action.get_property_value(id),
          on_change: async (form_input, valid) => {
            parent_action.set_property_value(id, form_input.get_value());
            await parent_action.on_set_property(id);

            // clear out the other value if we no longer need it
            if (other_value && !category.is_other_selected()) {
              category.string_form_input.set_value(null);
              parent_action.set_property_value(other_id, null);
              await parent_action.on_set_property(other_id);
            }
            this.update_element();
          },
          enum: { values: category.enum_list },
        });
        dropdown_el.append(category.enum_form_input.get_element());

        category.string_form_input = new CN_input_string(dropdown_el, {
          id: other_id,
          get_default: () => other_value,
          on_change: async (form_input, valid) => {
            parent_action.set_property_value(other_id, form_input.get_value());
            await parent_action.on_set_property(other_id);
            this.update_element();
          },
        });

        // only add the other string input when an "Other" status is selected
        if (category.is_other_selected()) {
          dropdown_el.append(category.string_form_input.get_element());
        }

        status_el.append(dropdown_el);
      }
    }

    // add the sound file list
    if (0 == this.#sound_file_list.length) {
      audio_el.innerHTML = "There are no sound files available for this test.";
    } else {
      audio_el.append(this.constructor.html(`
        <div class="d-flex justify-content-center pb-2">
          <div class="mx-2 fst-italic"><span class="fw-bold">Play/Pause:</span> Ctrl⋅Shift⋅L</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Backward:</span> Ctrl⋅Shift⋅&lt;</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Forward:</span> Ctrl⋅Shift⋅&gt;</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Prev Recording:</span> Ctrl⋅Shift⋅←</div>
          <div class="mx-2 fst-italic"><span class="fw-bold">Next Recording:</span> Ctrl⋅Shift⋅→</div>
        </div>
      `));

      this.#sound_file_list.forEach(sound_file => {
        const sound_file_id = `sound_file_${sound_file.id}`;
        const row_el = this.constructor.html('<div class="row ms-2 me-0 mb-3"></div>');
        sound_file.label_el = CN_element_label.create_element(row_el, {
          for: `sound_file_${sound_file.id}`,
          value: CN_common.uc_words(sound_file.name),
          class: `col-sm-3 rounded ${sound_file.active ? "text-bg-info" : ""}`,
        });
        sound_file.form_input = new CN_input_audio_url(row_el, {
          id: `sound_file_${sound_file.id}`,
          class: "col-sm-9",
          get_default: () => sound_file.url,
          on_focus: () => {
            // make the focused sound file active
            this.#sound_file_list.forEach(sf => {
              sf.active = sf.id == sound_file.id;

              // update the audio elements based on which is active
              if (sf.active) {
                sf.label_el.classList.add("text-bg-info");
              } else {
                sf.label_el.classList.remove("text-bg-info");
                sf.form_input.get_control_element().pause();
              }
            });
          },
          postfix: (el) => {
            CN_input_boolean.create_element(el, {
              id: `identifying_${sound_file.id}`,
              class: "ms-2",
              placeholder: "(select identifying)",
              get_default: () => sound_file.identifying,
              enum: {
                values: [
                  { key: true, value: "Identifying" },
                  { key: false, value: "Not Identifying" },
                ],
              },
              on_change: async (form_input, valid) => {
                form_input.set_disabled(true);
                try {
                  // update the server
                  let data = {}; 
                  data.identifying = await form_input.get_value_for_record();
                  await CN_api.patch(`sound_file/${sound_file.id}`, data);
                  sound_file.identifying = form_input.get_value();
                } finally {
                  form_input.set_disabled(false);
                  this.update_element();
                }
              },
            });
          },
        });
        row_el.append(sound_file.form_input.get_element());
        audio_el.append(row_el);
      });
    }
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    const body_el = this.constructor.html(`
      <div class="conatiner-fluid">
        <div name="test-entry" class="container-fluid"></div>
        <div name="status" class="d-flex mx-1"></div>
        <hr />
        <div name="audio" class="mb-2"></div>
      </div>
    `);

    return body_el;
  }
}
