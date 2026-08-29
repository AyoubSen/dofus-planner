# Recognition validation

How this project decides whether it is allowed to believe a number it read off
the screen.

## The claim, stated precisely

The reader does **not** claim to never be wrong. That claim is not purchasable
from any recogniser at any threshold, and asserting it would be the same kind of
overconfidence the pipeline is being rebuilt to remove.

What it claims is:

> Wrong only if the renderer model is wrong in a way validation missed, at a
> false-accept rate measured on held-out real captures and reported with its
> bound — and abstaining otherwise.

Every clause there is a measurement, and the pieces below produce them.

## Why reconstruction rather than agreement

Two recognisers agreeing looks like corroboration and mostly is not. They
consume the same crop, the same segmentation, the same background estimate and
the same profile, so an error upstream of the split reaches both identically and
they agree — confidently, and wrongly. Ensemble agreement bounds *classifier*
disagreement; it does not bound *pipeline* error.

Reconstruction is a different kind of evidence. It redraws the candidate string
with a model of the client's own rasteriser and compares against **the original
pixels**, not against a second opinion derived from the same preprocessing.

It is still not proof. The rasteriser, gamma, outline, segmentation and the
threshold are all *modelled*, so a systematically wrong model could pass a wrong
string. That is precisely why the model is fitted and its fit reported, rather
than assumed.

## The pieces

| File | Job |
|---|---|
| `app/utils/render/types.ts` | The renderer model: coverage, render parameters, what they mean |
| `app/utils/render/reconstruct.ts` | Redraw a candidate, score it, and the two acceptance gates |
| `app/utils/render/calibrate.ts` | Fit render parameters to real captures; judge equivalence |
| `app/utils/render/selectiveRisk.ts` | Coverage vs false-accept, with the 95% bound |
| `app/utils/render/syntheticFont.ts` | Stand-in rasteriser so the machinery is testable today |
| `server/utils/corpusStore.ts` | The on-disk archive of real captures |
| `scripts/grade-corpus.mjs` | Runs the gate over the archive |

## Two gates, and why both

**Residual** — how much of the signal the candidate fails to explain.
**Margin** — how much better it explains it than the next-best candidate.

A small residual with a small margin means two strings explain the pixels nearly
equally well, and picking either is a coin flip wearing a measurement's clothes.

Measured on the synthetic profile, the two fail in the right order: as an image
degrades, the *residual* crosses its threshold (0.057 at noise level 12) before
the *margin* collapses to meaninglessness (0.007 at the same point). So a
degraded capture is refused for being unexplained rather than sneaking through
on a coin-flip margin. `reconstruct.spec.ts` pins that ordering.

## Two normalisations that testing forced

Both were discovered by the synthetic tests and both were real design errors:

1. **Score over ink, not over the canvas.** Averaging across every pixel divides
   the disagreement by however much empty panel the crop happened to include, so
   the same wrong digit scored ten times worse on a tight crop than a loose one.
   The mask is the *union* of candidate ink and target ink — union, because a
   candidate that draws nothing would otherwise score perfectly on its own empty
   mask, which is the most dangerous failure available.
2. **Divide by contrast.** Before this, the same wrong digit scored 0.30 on a
   light panel and 0.79 on a dark one, so no fixed threshold could be correct for
   both. After it, the score is 0.0263 across backgrounds from luma 8 to 200.

A third bug the tests caught: background estimation using a per-column quartile
lands *on the text* when a column is mostly ink, so the "background" came back as
the foreground — and predicted then matched target perfectly wherever the glyph
was solid, scoring zero residual on a completely wrong estimate. Fixed with a low
percentile plus a horizontal min-filter.

## Current status

- **Machinery: validated synthetically.** 442 tests pass. Correct strings
  reconstruct to 0.000; single-digit errors separate cleanly; the confusable
  pairs (6/8, 0/8, 3/9, 1/7) are distinguished; sub-pixel phases 0/0.25/0.5/0.75
  all reconstruct exactly; brightness invariance holds from luma 8 to 200.
- **Real profiles: not yet validated.** This needs captures from the Dofus
  client, which accumulate only through normal use, plus the client's font.
  **No real profile is enabled for automatic reading and none should be until
  `pnpm corpus:gate` passes for it.**

That gap is the honest state of phase 1a, not an oversight. The machinery was
built and proven first deliberately: a verifier with a bug in it would otherwise
be discovered *while* interpreting real data, and every conclusion drawn before
that point would be suspect.

## Collecting the corpus

Capture archiving is on by default. Use the app on the HDV as normal; every
capture writes crops plus a manifest under `corpus/` (gitignored). **Crops
only — the desktop frame is never written to disk.**

Then:

```bash
pnpm corpus:grade   # report
pnpm corpus:gate    # exit non-zero if a profile fails
```

Even with no confirmed truths, the report gives the **reader disagreement rate**
immediately: every disagreement is a case where one of the two current readers is
definitely wrong. That is the first honest measurement of today's pipeline, and
it needs no labelling at all.

## The gate

A profile is enabled for automatic reading only when:

- zero wrong reads on its held-out samples, **and**
- coverage above the floor, **and**
- enough samples to mean anything.

The coverage floor is not decoration. Without it, the cheapest way to satisfy a
zero-error gate is to answer nothing — and a reader optimised for that scores
perfectly while being worse than what it replaced.

Reports always print the 95% upper bound next to the count. Zero failures in `n`
trials bounds the rate at roughly `3/n`: a clean run on 300 samples buys "under
about 1%", not "never". Printing the count alone invites reading it as a
guarantee, which is the exact error this document exists to prevent.
