import { CN_base_data_model, CN_base_data_test } from "./base_data_model.mjs"

export class CN_premat_data_model extends CN_base_data_model {
  constructor() {
    super("pre-MAT");
  }
}

export class CN_premat_data_test extends CN_base_data_test {
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
