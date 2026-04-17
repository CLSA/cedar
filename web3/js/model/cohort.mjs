const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

const classes = await import(`${CENOZO_URL}/js/model/cohort.mjs`);
export class CN_cohort_model extends classes.CN_cohort_model {
  /**
   * Extend parent method
   */
  allow_choose() {
    return super.allow_choose() && 3 <= CN_session.get("role", "tier");
  }
}
