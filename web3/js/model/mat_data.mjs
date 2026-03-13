import { CN_base_data_model, CN_base_data_test } from "./base_data_model.mjs"

export class CN_mat_data_model extends CN_base_data_model {
  constructor() {
    super("MAT");
  }
}

export class CN_mat_data_test extends CN_base_data_test {
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
