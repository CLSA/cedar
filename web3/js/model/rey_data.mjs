import { CN_base_data_model, CN_base_data_test } from "./base_data_model.mjs"

export class CN_rey_data_model extends CN_base_data_model {
  constructor() {
    super("REY");
  }
}

export class CN_rey_data_test extends CN_base_data_test {
  constructor(parent_el, model) {
    super(parent_el, model);
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();
  }
}

/*
// stuff we'll need to load from the rey_data record
language_id
language_code: language.code
drum: "Drum;Tambour" drum_rey_data_variant_id
curtain: "Curtain;Rideau" curtain_rey_data_variant_id
bell: "Bell;Cloche" bell_rey_data_variant_id
coffee: "Coffee;Café" coffee_rey_data_variant_id
school: "School:École" school_rey_data_variant_id
parent: "Parent;Parent" parent_rey_data_variant_id
moon: "Moon;Lune" moon_rey_data_variant_id
garden: "Garden;Jardin" garden_rey_data_variant_id
hat: "Hat;Chapeau" hat_rey_data_variant_id
farmer: "Farmer;Fermier" farmer_rey_data_variant_id
nose: "Nose;Nez" nose_rey_data_variant_id
turkey: "Turkey;Dinde" turkey_rey_data_variant_id
colour: "Colour;Couleur" colour_rey_data_variant_id
house: "House;Maison" house_rey_data_variant_id
river: "River;Rivière" river_rey_data_variant_id

export class CN_rey_data_test extends CN_action_base_test {
  #language_list = [];
  #word_list = [];
  #intrusion_list = [];

  constructor(parent_el, model) {
    super(parent_el, model);
  }

  /**
   * Extends parent method
   *
  async on_load() {
    await super.on_load();

    // get the current test_entry_id and language
    const test_entry_id = this.get_property_value("test_entry_id");
    const lang = this.get_property_value("language_code");

    // build the word list based on all boolean properties
    this.#word_list = this.get_all_properties().reduce((list, p) => {
      if ("boolean" == p.type) {
        // in the model we've set the title to both english and french words (separated by a ;)
        const [en, fr] = p.title.split(";");
        list.push({ name: p.name, label: "en" == lang ? en : fr, variants: [] });
      }
      return list;
    }, []);

    // get additional data required for this data type
    const [language_response, variant_response, intrusion_response] = await Promise.all([
      CN_api.get(`test_entry/${test_entry_id}/language`, {
        select: { column: "code" },
        modifier: { order: "code" },
      }),

      CN_api.get("rey_data_variant", {
        // get the id, word and variant word
        select: {
          column: [
            "id",
            "word",
            { table: "variant_language", column: "code" },
            { table: "variant", column: "word", alias: "variant" },
          ]
        },
        // only get the language we need
        modifier: {
          where: {
            column: "language.code",
            operator: "=",
            value: lang,
          }
        },
      }),

      CN_api.get(`rey_data/${this.get_model().get_identifier()}/word`, {
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

    // track which languages the test-entry uses
    this.#language_list = language_response.map(language => language.code);

    // add all variants to the word list
    variant_response.forEach(variant => this.#word_list.find(w => w.name == variant.word).variants.push(variant));

    // get a list of all intrusions
    this.#intrusion_list = intrusion_response;
  }

  /**
   * Extends parent method
   *
  update_element() {
    super.update_element();

    // clear out dynamic content
    const words_el = this.get_body_element().querySelector("[name=words] tbody");
    const intrusion_el = this.get_body_element().querySelector("[name=intrusion-list]");
    words_el.innerHTML = "";
    intrusion_el.innerHTML = "";

    // build the word list

    this.#word_list.forEach(word => {
      const tr_el = document.createElement("tr");

      // add the word label
      tr_el.innerHTML += `<td class="text-end">${word.label}</td>`;

      // add the yes/no radio buttons
      let yes_no_td = '<td class="text-center">';
      yes_no_td += `
        <input id="${word.name}_yes" type="radio"></input>
        <label for="${word.name}_yes">Yes</label>
      `;
      yes_no_td += `
        <input id="${word.name}_no" type="radio"></input>
        <label for="${word.name}_no">No</label>
      `;
      yes_no_td += "</td>";
      tr_el.innerHTML += yes_no_td;

      // add the variants
      let variants_td = "<td>";
      word.variants.forEach(variant => {
        variants_td += `
          <span class="pe-2">
            <input
              type="radio"
              id="variant_${variant.id}"
              ${this.#language_list.includes(variant.code) ? "" : "disabled=true"}
            ></input>
            <label
              for="variant_${variant.id}"
              ${this.#language_list.includes(variant.code) ? "" : 'class="text-muted"'}
            >${variant.variant}</label>
          </span>
        `;
      });
      variants_td += "</td>";
      tr_el.innerHTML += variants_td;

      words_el.append(tr_el);
    });

    // build the intrusion list
    if (0 == this.#intrusion_list.length) {
      if (!this.get_model().allow_edit()) {
        intrusion_el.innerHTML = this.constructor.html(
          '<div class="text-info">No intrusions have been entered.</div>'
        );
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
              [${intrusion.code}] ${intrusion.word}
            </button>
          </span>
        `));
      });

      intrusion_el.append(buttons_el);
    }
  }

  /**
   * Replace parent method
   *
  create_body_element() {
    const body_el = this.constructor.html(`
      <div class="conatiner-fluid">
        <div name="record"></div>
        <div name="words">
          <table class="table table-striped"><tbody></tbody></table>
        </div>
        <div name="intrusions">
          <div name="intrusion-list" class="container-fluid"></div>
          <div name="intrusion-add" class="container-fluid"></div>
        </div>
        <div name="status"></div>
        <div name="audio"></div>
      </div>
    `);

    // add the record details
    body_el.querySelector("[name=record]").append(super.create_body_element());

    // add the intrusion word entry
    const word_row_el = this.constructor.html('<div class="row mb-3"></div>');
    CN_element_label.create_element(word_row_el, {
      for: "new_word_id",
      value: "Enter Word",
      class: "col-sm-3",
    });
    const word_form_input = new CN_input_typeahead({
      id: "new_word_id",
      class: "d-flex align-items-center col-sm-9",
      typeahead: CN_word_model.get_typeahead(),
      postfix: (el) => {
        const btn_el = this.constructor.html(
          '<button type="button" class="btn btn-outline-primary ms-2">Mark Remaining As No</button>'
        );
        btn_el.addEventListener("click", async () => {
          // TODO: implement
        });
        el.append(btn_el);
      },
      required: true,
    });
    word_form_input.set_parent_element(word_row_el);
    word_row_el.append(word_form_input.get_element());
    body_el.querySelector("[name=intrusion-add]").append(word_row_el);

    return body_el;
  }
}
*/
