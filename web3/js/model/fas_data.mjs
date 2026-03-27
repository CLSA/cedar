import { CN_base_rank_data_model, CN_base_rank_data_test } from "./base_rank_data.mjs"

export class CN_fas_data_model extends CN_base_rank_data_model {
  constructor() {
    super("FAS");
  }
}

export class CN_fas_data_test extends CN_base_rank_data_test {}
