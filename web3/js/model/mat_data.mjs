import { CN_model_base_rank_data, CN_test_base_rank_data } from "./base_rank_data.mjs"

export class CN_model_mat_data extends CN_model_base_rank_data {
  constructor() {
    super("MAT");
  }
}

export class CN_test_mat_data extends CN_test_base_rank_data {
  constructor(parent_el, model) {
    super(parent_el, model, "character");
  }
}
