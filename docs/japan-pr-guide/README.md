# Japan PR Guide documentation

- [Product and UX contract](DESIGN_CONTRACT.md)
- [Design QA status](DESIGN_QA.md)
- [HSP-to-PR workflow diagram](japan-pr-guide-flow.html)
- [Historical scoring-parity implementation plan](historical-scoring-parity-plan.md)

The product contract is authoritative. The implementation plan is retained only as historical engineering context.

## Official-source update, 2026-10-05

Editable source: `_sources/japan-pr-guide/`. Run `npm ci && npm run release:pages` there to validate and regenerate the app. The recovered baseline reproduced deployed JS/CSS byte for byte.

- [ISA revision published 1 October 2026](https://www.moj.go.jp/isa/10_00279.html): generally applies from 1 April 2027. Section 6 separately applies income/public-burden provisions to applications filed from six months before publication and pending on publication day. The UI flags this conditional provision, without adjudicating a case.
- [Previous guideline](https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html): retained for earlier filing dates, subject to transitions.
- [ISA PR application procedure](https://www.moj.go.jp/isa/applications/procedures/16-4.html): standard approval fee ¥200,000 from 1 October 2026; applications accepted through 30 September retain ¥10,000. [Qualifying reductions](https://www.moj.go.jp/isa/10_00273.html): ¥20,000. Special residence-card issuance can add fees; acquisition of status is exempt. UI estimates the standard fee for changing to PR.
- [ISA point-system index](https://www.moj.go.jp/isa/applications/resources/newimmiact_3_evaluate_index.html) still links the [existing English table](https://www.moj.go.jp/isa/content/001398882.pdf). Scoring arithmetic stays in `src/domain/scoring.js`.
- [ISA Innovative Asia partner PDF](https://www.moj.go.jp/isa/content/930001659.pdf): corrected the old link to the unrelated rankings PDF `001335478.pdf`, added four Singapore/Brunei partners and narrowed Thammasat to SIIT. [MOFA programme](https://www.mofa.go.jp/mofaj/ic/ap_m/page22_002808.html) distinguishes 60 training partners from 64 for residence incentives. MOFA's 60-school PDF calls the Bangladesh entry BUET; ISA's Japanese PDF uses `イスラム・バングラデシュ工科大学`. The UI preserves the mismatch and requests institution confirmation rather than asserting equivalence.
- [NPA bicycle rules](https://www.npa.go.jp/bureau/traffic/bicycle/info.html): blue tickets cover cyclists aged 16+ from 1 April 2026. Administrative penalties differ from criminal fines; ISA assesses conduct separately.
- [NPA FY2026 traffic-safety plan](https://www.npa.go.jp/bureau/traffic/keikaku/R8_keikaku.pdf): confirms foreign-licence changes effective October 2025. No PR rejection inferred from licence procedures.
- [MOFA fees from July 2026](https://www.mofa.go.jp/j_info/visit/visa/procedure/pagewe_000001_00391.html): about ¥15,000 single entry/¥30,000 multiple entry; local currency, exemptions and handling fees vary. These consular fees are separate from PR fees.
- [MOFA visa/residence distinction](https://www.mofa.go.jp/j_info/visit/visa/system/index.html): entry visa, landing permission and residence status have different legal functions.

The five-step flow remains. Filing date drives policy labels, fee and historical checkpoint. Default date is today's Japan date; review date remains fixed. Leap-day checkpoints are clamped. The initial profile is labelled as an example, no evidence is pre-confirmed, and changing date clears confirmations. Endpoint scores do not prove continuous points throughout the new qualifying period.

No invented household-income amount, language equivalence, automatic absence rejection, or traffic-ticket PR exclusion becomes an eligibility gate.

Direct visual inspection of ISA English points PDF also identified and corrected a legacy calculator error: non-professional doctorates award 30 points in both academic and technical activities; business remains 20. The technical maximum is now 30. A UI regression covers the 85-point technical profile and its 80-point one-year historical checkpoint.
