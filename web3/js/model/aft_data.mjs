import { CN_base_rank_data_model, CN_base_rank_data_test } from "./base_rank_data.mjs"

export class CN_aft_data_model extends CN_base_rank_data_model {
  constructor() {
    super("AFT");
  }
}

export class CN_aft_data_test extends CN_base_rank_data_test {
  constructor(parent_el, model) {
    super(parent_el, model, "word");
  }
}
