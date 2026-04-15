const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);
const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_modal_confirm } = await import(`${CENOZO_URL}/js/element/modal/confirm.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/element/modal/input.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_word_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "word",
        plural: "words",
        posessive: "word's",
      },
      columns: {
        language: { column: "language.name", title: "Language" },
        word: { column: "word.word", title: "Word" },
        animal_code: { column: "word.animal_code", title: "Animal Code" },
        sister_word: { column: "sister_word.word", title: "Parent Sister" },
        compound_count: { title: "Compounds", type: "number", table_prefix: false },
        misspelled: { column: "word.misspelled", title: "Misspelled", type: "boolean" },
        aft: { column: "word.aft", title: "AFT Type" },
        fas: { column: "word.fas", title: "FAS Type" },
        aft_total: { column: "word_test_type_total.aft_total", title: "#AFT", type: "number" },
        fas_total: { column: "word_test_type_total.fas_total", title: "#FAS", type: "number" },
        rey_total: { column: "word_test_type_total.rey_total", title: "#REY", type: "number" },
        update_timestamp: { column: "word.update_timestamp", title: "Timestamp", type: "datetime" },
      },
      get_default_order: () => "word",
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
          is_constant: (model) => "view" == model.get_action_name(),
        },
        word: {
          title: "Word",
          format: "identifier",
          is_constant: (model) => "view" == model.get_action_name(),
        },
        animal_code: {
          title: "Animal Code",
          // regex is exactly 7 integers >= 0 delimited by a period (.)
          regex: "^(([0-9]|[1-9][0-9]+).){6}([0-9]|[1-9][0-9]+)$",
        },
        sister_word_id: {
          title: "Parent Sister Word",
          type: "typeahead",
          typeahead: CN_word_model.get_typeahead(),
          on_change: async (form_input, valid) => {
            const sister_word_id = await form_input.get_action().get_property_value_for_record("sister_word_id");

            let proceed = true;
            if (sister_word_id) {
              // warn if the sister word is an intrusion
              const response = await CN_api.get(`word/${sister_word_id}`, { select: { column: "fas" } });
              if ("intrusion" == response.fas) {
                proceed = await CN_modal_confirm.create_and_open({
                  title: "Parent Sister Word is Intrusion",
                  message: `
                    Warning: the parent sister word you have selected, "${form_input.get_value()}",
                    is an FAS intrusion.  Are you sure you have selected the correct word?
                  `,
                });
              }
            }

            await form_input.get_action().on_property_change("sister_word_id", proceed ? valid : false);
          },
          is_constant: (model) =>
            "view" == model.get_action_name() &&
            0 < model.get_action().get_property_value('compound_count'),
        },
        misspelled: {
          title: "Misspelled",
          type: "boolean",
          // misspelled must stay as false once either the aft or fas is set to intrusion or primary
          is_constant: (model) => [
            model.get_action().get_property_value("aft"),
            model.get_action().get_property_value("fas")
          ].some(value => ["intrusion", "primary"].includes(value)),
        },
        aft: { title: "AFT Type", type: "enum" },
        fas: { title: "FAS Type", type: "enum" },
        description: { title: "Description", type: "text" },
        compound_count: { meta: {}, is_hidden: () => true },
      },
    });
  }

  /**
   * Non admins can only edit words under certain circumstances
   */
  allow_edit() {
    return super.allow_edit() && !(
      3 > CN_session.get("role", "tier") &&
      null != this.get_action().get_property_value("misspelled") &&
      null != this.get_action().get_property_value("aft") &&
      null != this.get_action().get_property_value("fas")
    );
  }

  /**
   * Returns the HTML friendly name for a word
   * @return string
   */
  static get_word_html(word) {
    return `<span class="text-bg-info rounded-1 p-1">${word.code}</span> ${word.word}`;
  }

  /**
   * Determines whether a word is valid
   * Valid words start with a letter, may have [-' ] in the middle and ends with a letter,
   * must be 2+ characters long and may be enclosed by double-quotes (")
   * @param integer|[] language_id: Restricts words to the provided language id or array of language ids
   * @param string word
   * @return boolean
   */
  static is_word_valid(word, language_id = null) {
    word = word.replace(/^"([^"]+)"$/, "$1"); // remove double quotes at front/end
    let letters = "";
    if (language_id) {
      const list = CN_common.is_array(language_id) ? language_id : [language_id];
      letters = language_id.reduce((str, id) => {
        str += CN_session.get("setting", "special_letter")[id];
        return str;
      }, "");
    }

    var re = new RegExp(`^[a-z${letters}]([-' a-z${letters}]*[a-z${letters}])?$`);
    return null != word.match(re);
  }

  /**
   * Returns a typeahead object for models that have a typeahead property referencing this model
   * @param [{}] where: An array of where statements to include when searching for words
   * @return object
   * @static
   */
  static get_typeahead(where = []) {
    return {
      min_length: 1,
      on_select: async (form_input, item) => {
        form_input.set_value(null == item.value ? null : `${item.word} [${item.code}]`);
        form_input.commit_value();
        if (form_input.has_config("on_change")) {
          form_input.get_config("on_change")(form_input, await form_input.validate());
        }
      },
      get_list: async (value) => {
        // put the exact match at the top of the returned list
        const special_order = {};
        special_order[`word="${value}"`] = true;

        const modifier = {
          where: CN_common.clone(where),
          order: [special_order, "word"],
          limit: 20,
        };

        // add defaults to the where statement
        modifier.where.push({ column: "misspelled", operator: "=", value: false });
        modifier.where.push({
          column: 'word.word',
          operator: 3 > value.length ? "=" : "LIKE",
          value: 3 > value.length ? value : `${value}%`
        });

        return (await CN_api.get("word", {
          select: {
            column: [
              { column: "id", alias: "key" },
              "word",
              "aft",
              "fas",
              "language_id",
              { table: "language", column: "code" },
            ],
          },
          modifier: modifier,
        })).map(item => {
          item.value = this.get_word_html(item);
          return item;
        });
      },
    };
  }
}

export class CN_word_view extends CN_action_view {
  /**
   * Remove the compound model from the selector's child list when the animal code is defined
   */
  get_selector_child_list() {
    const animal_code = this.get_property_value("animal_code");
    return super.get_selector_child_list().filter(c => null == animal_code || "compound" != c.model.get_name());
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      return this.get_property_value("word");
    }
    return await super.get_text(type);
  }

  /**
   * Additional actions must be taken after changing some properties
   */
  async on_set_property(prop_name) {
    if (!["misspelled", "aft", "fas"].includes(prop_name)) {
      // no change in functionality required
      await super.on_set_property(prop_name);
      return;
    }

    const word = this.get_property_value("word");
    const language_id = this.get_property_value("language_id");
    const language = this.get_property("language_id").form_input.enum.values.find(
      option => option.key == language_id
    ).value;

    const data = { correct_word: null, note: null };

    if ("misspelled" == prop_name) {
      const typeahead = CN_word_model.get_typeahead([
        { column: "word.language_id", operator: "=", value: language_id }
      ]);
      data.correct_word = await CN_modal_input.create_and_open({
        title: "Select Correct Word",
        message: `
          Please select the correct spelling for this word.<br/><br/>
          If you provide a word then all test-entries using the misspelled word will be changed to the
          selected word. You may leave the replacement word blank if you do want test-entries to be affected.
        `,
        input: {
          type: "typeahead",
          typeahead: typeahead,
        },
      });

      if (undefined === data.correct_word) {
        this.get_property(prop_name).form_input.undo_value();
        await this.run();
        return; // the update has been cancelled, do not proceed
      }

      // if a word was selected then convert typeahead from value to key
      if (data.correct_word) data.correct_word = typeahead.list.find(w => w.value = data.correct_word).key;
    }

    // determine which test entries will be affected by this change
    let which = "All";
    if ("invalid" == data.aft) {
      which = "invalid" == this.get_property_value("fas") ? "All AFT and REY" : "All AFT";
    } else if ("invalid" == data.fas) {
      which = "invalid" == this.get_property_value("aft") ? "All FAS and REY" : "All FAS";
    }

    // get the message for updated test entries
    data.note = await CN_modal_input.create_and_open({
      title: "Test Entry Note",
      message: `
        ${which} test entries using this word will be re-assigned to the last user that it was assigned to.
        Please provide a note that will be added to these test-entries:
      `,
      input: {
        type: "text",
        value: `
          The ${language} word "${word}" which is used by this test-entry has been marked as invalid.
          Please replace this word with another valid word and re-submit.
        `,
      },
    });

    if (undefined === data.note) {
      this.get_property(prop_name).form_input.undo_value();
      await this.run();
      return; // the update has been cancelled, do not proceed
    }

    // we now re-implement the parent's on_set_property method but with customizations
    try {
      data[prop_name] = await this.get_property_value_for_record(prop_name);
      await CN_api.patch(this.get_model().get_view_url(null, "api"), data);
    } catch (error) {
      this.get_property(prop_name).form_input.undo_value();
      if (409 == error.response.status) {
        JSON.parse(error.body).forEach(prop_name => {
          this.get_property(prop_name).element.show_error("Conflicts with existing record", 5000);
        });
      } else {
        this.run();
        throw error;
      }
    }

    await this.run();
  }
}
