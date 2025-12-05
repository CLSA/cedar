const CN_api = (await import(`${CENOZO_URL}/js/api.mjs`)).default;
const CN_element = (await import(`${CENOZO_URL}/js/element.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);
const { CN_base_view } = await import(`${CENOZO_URL}/js/base_view.mjs`);
import { CN_word_model } from "./word.mjs"

export class CN_rey_data_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "REY data",
        plural: "REY datas",
        posessive: "REY data's",
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
          on_change: async (control_el, valid, action) => {
            // run the default behaviour
            await action.on_change("language_id", valid);

            // then update the element to propagate the changed property
            if (valid) action.update_element();
          },
        },
        supplementary: {
          is_hidden: () => true,
          properties: {
            language_code: { meta: { table: "language", column: "code" }, is_hidden: () => true },
            drum: { title: "Drum;Tambour", type: "boolean", is_hidden: () => true },
            drum_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            curtain: { title: "Curtain;Rideau", type: "boolean", is_hidden: () => true },
            curtain_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            bell: { title: "Bell;Cloche", type: "boolean", is_hidden: () => true },
            bell_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            coffee: { title: "Coffee;Café", type: "boolean", is_hidden: () => true },
            coffee_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            school: { title: "School:École", type: "boolean", is_hidden: () => true },
            school_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            parent: { title: "Parent;Parent", type: "boolean", is_hidden: () => true },
            parent_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            moon: { title: "Moon;Lune", type: "boolean", is_hidden: () => true },
            moon_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            garden: { title: "Garden;Jardin", type: "boolean", is_hidden: () => true },
            garden_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            hat: { title: "Hat;Chapeau", type: "boolean", is_hidden: () => true },
            hat_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            farmer: { title: "Farmer;Fermier", type: "boolean", is_hidden: () => true },
            farmer_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            nose: { title: "Nose;Nez", type: "boolean", is_hidden: () => true },
            nose_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            turkey: { title: "Turkey;Dinde", type: "boolean", is_hidden: () => true },
            turkey_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            colour: { title: "Colour;Couleur", type: "boolean", is_hidden: () => true },
            colour_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            house: { title: "House;Maison", type: "boolean", is_hidden: () => true },
            house_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            river: { title: "River;Rivière", type: "boolean", is_hidden: () => true },
            river_rey_data_variant_id: { type: "integer", is_hidden: () => true },
            test_entry_id: { is_hidden: () => true },
          }
        },
      },
    });
  }
}

export class CN_rey_data_view extends CN_base_view {
  #language_list = [];
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

    // get the current test_entry_id and language
    const test_entry_id = this.get_property("test_entry_id").state.get();
    const lang = this.get_property("language_code").state.get();

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
   */
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
        intrusion_el.innerHTML = CN_element.create(
          '<div class="text-info">No intrusions have been entered.</div>'
        );
      }
    } else {
      let buttons_el = null;
      this.#intrusion_list.forEach((intrusion, index) => {
        if (0 == index%4) {
          if (buttons_el) intrusion_el.append(buttons_el);
          buttons_el = CN_element.create('<div class="row"></div>');
        }

        let btn_class = (
          "variant" == intrusion.word_type ? "warning" :
          "intrusion" == intrusion.word_type ? "success" :
          "danger" // "invalid" == intrusion.word_type
        );
        buttons_el.append(CN_element.create(`
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
   */
  create_body_element() {
    const body_el = CN_element.create(`
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
    const word_row_el = CN_element.create('<div class="row mb-3"></div>');
    const word_label_el = CN_element.create_form_label({ for: "new_word_id", value: "Enter Word" });
    word_label_el.classList.add("col-sm-3");
    word_row_el.append(word_label_el);
    const word_element_el = CN_element.create_form_element("typeahead", {
      id: "new_word_id",
      typeahead: CN_word_model.get_typeahead(),
      set_postfix: () => {
        const btn_el = CN_element.create(
          '<button type="button" class="btn btn-outline-primary ms-2">Mark Remaining As No</button>'
        );
        btn_el.addEventListener("click", async () => {
          // TODO: implement
        });
        return btn_el;
      },
      required: true,
    });
    word_element_el.classList.add("col-sm-9");
    word_row_el.append(word_element_el);
    body_el.querySelector("[name=intrusion-add]").append(word_row_el);

    return body_el;
  }
}
