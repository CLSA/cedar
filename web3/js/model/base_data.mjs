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
  #data_name;

  constructor(data_name) {
    super({
      wording: {
        singular: `${data_name} data`,
        plural: `${data_name} data`,
        posessive: `${data_name} data's`,
      },
    });

    if ("CN_base_data_model" == this.constructor) {
      throw new Error("Abstract class CN_base_data_model can't be instantiated.");
    }   

    this.#data_name = data_name.toLowerCase().replace(/[^a-z]g/, "");
  }

  get_data_name() { return this.#data_name; }
}

export class CN_base_data_test extends CN_base_action {
  #language_list = [];
  #status_type_list = [];
  #sound_file_list = [];
  #status_categories = {};
  #on_keydown;

  /**
   * Extends parent method
   */
  constructor(parent_el, model) {
    super("test", parent_el, model);

    if ("CN_base_data_test" == this.constructor) {
      throw new Error("Abstract class CN_base_data_test can't be instantiated.");
    }   

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
   * ADD DOCS
   */
  get_api_path() {
    const model = this.get_model();
    const test_entry_id = model.get_parent_model().get_identifier();
    const data_name = model.get_data_name();
    return (
      'rey' == data_name ?
      `${data_name}_data/test_entry_id=${test_entry_id}` :
      `test_entry/${test_entry_id}/${data_name}_data`
    );
  }

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
      CN_api.get(`test_entry/${test_entry_id}/language`),

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
    this.#language_list = language_response;

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
    // only define the status categories once
    if (0 < this.#status_type_list.length && 0 == Object.keys(this.#status_categories)) {
      const parent_action = this.get_model().get_parent_model().get_action();

      // create an enum for all status types
      this.#status_type_list.forEach(status_type => {
        if (!this.#status_categories[status_type.category]) {
          this.#status_categories[status_type.category] = {
            enum_list: [],
            status_form_input: null,
            other_form_input: null,
            is_other_selected: function() {
              const status = this.enum_list.find(obj => obj.key == this.status_form_input.get_value());
              return status && status.value.match(/\bother\b/i);
            },
          };
        }
        this.#status_categories[status_type.category].enum_list.push({
          key: status_type.id,
          value: status_type.name
        });
      });

      const status_el = this.get_body_element().querySelector("[name=status]");
      status_el.innerHTML = "";
      for (const cat_name in this.#status_categories) {
        const category = this.#status_categories[cat_name];
        const status_id = `${cat_name}_status_type_id`;
        const other_id = `${cat_name}_status_type_other`;
        const other_value = parent_action.get_property_value(other_id);

        category.element = this.constructor.html('<div name="${cat_name}" class="w-100 m-2"></div>');
        CN_element_label.create_element(category.element, {
          for: status_id,
          value: `${CN_common.uc_words(cat_name)} Status`,
        });

        category.status_form_input = new CN_input_enum(category.element, {
          id: status_id,
          get_default: () => parent_action.get_property_value(status_id),
          on_change: async (form_input, valid) => {
            if (valid) {
              await this.#set_status(cat_name);
            } else {
              form_input.undo_value(true);
            }
          },
          enum: { values: category.enum_list },
        });
        category.element.append(category.status_form_input.get_element());

        category.other_form_input = new CN_input_string(category.element, {
          id: other_id,
          get_default: () => other_value,
          on_change: async (form_input, valid) => {
            if (valid) {
              await this.#set_status(cat_name);
            } else {
              form_input.undo_value(true);
            }
          },
        });

        status_el.append(category.element);
      }
    }

    // show the other string input when an "Other" status is selected
    for (const cat_name in this.#status_categories) {
      const category = this.#status_categories[cat_name];
      const other_el = category.other_form_input.get_element();
      if (category.is_other_selected()) {
        category.element.append(other_el);
      } else {
        other_el.remove();
      }
    }

    // rebuild the audio list
    const audio_el = this.get_body_element().querySelector("[name=audio]");
    audio_el.innerHTML = "";

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
   * Must be implemented by all child classes
   */
  create_test_entry_element() {
    return null;
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    const body_el = this.constructor.html(`
      <div class="conatiner-fluid">
        <div name="test-entry" class="container-fluid"></div>
        <hr />
        <div name="status" class="d-flex mx-1"></div>
        <hr />
        <div name="audio" class="mb-2"></div>
      </div>
    `);

    body_el.querySelector("div[name=test-entry]").append(this.create_test_entry_element());

    return body_el;
  }

  /**
   * ADD DOCS
   */
  async #set_status(cat_name) {
    const test_entry_id = this.get_model().get_parent_model().get_identifier();
    const category = this.#status_categories[cat_name];
    const status_id = `${cat_name}_status_type_id`;
    const other_id = `${cat_name}_status_type_other`;
    const status_value = await category.status_form_input.get_value_for_record();
    const other_value = (
      category.is_other_selected() ?
      await category.other_form_input.get_value_for_record() :
      null
    );

    let data = {};
    data[status_id] = status_value;
    data[other_id] = other_value;
    await CN_api.patch(`test_entry/${test_entry_id}`, data);
    category.other_form_input.set_value(other_value);

    this.update_element();
  }
}
