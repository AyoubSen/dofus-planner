// Deciding which item a capture belongs to.
//
// This is one small function because it guards the most expensive mistake the
// app can make, and because a rule that lives inside a component cannot be
// tested. The live path used to file an observation against whatever item was
// selected when recognition *finished*, while the screenshot itself was taken
// against whatever was armed when the hotkey fired. Those are usually the same
// item and occasionally are not — switch items mid-flight, or open a second
// tab, and item A's price is saved under item B.
//
// That failure is worse than a misread number, because the number is correct.
// Nothing about the stored row looks wrong, so nothing prompts you to check it,
// and it goes on to move the median that every later plausibility check and
// every later valuation is judged against.
//
// The rule: the capture's own identity decides, and a disagreement is refused
// rather than resolved. There is no correct way to guess which of the two items
// the user meant.

export type CaptureIdentityOutcome =
  | { ok: true; itemKey: string }
  | { ok: false; reason: 'no-capture-item' | 'no-open-item' | 'mismatch'; headline: string; message: string }

export interface CaptureIdentityInput {
  /** The item name the capture was armed on, as recorded when it was taken. */
  captureItemName: string
  /** The item the app has open right now. */
  openItemName: string
  /** Normalizer shared with the rest of the app, so keys agree exactly. */
  normalize: (value: string) => string
}

/**
 * Whether a capture may be stored, and under which key.
 *
 * Refusing is cheap — the user re-arms and re-hovers — where accepting a
 * mis-filed capture is silent and permanent.
 */
export const resolveCaptureIdentity = (input: CaptureIdentityInput): CaptureIdentityOutcome => {
  const captureName = String(input.captureItemName || '').trim()
  const openName = String(input.openItemName || '').trim()

  if (!captureName) {
    return {
      ok: false,
      reason: 'no-capture-item',
      headline: 'NO ITEM',
      message: 'Capture carried no item identity',
    }
  }

  if (!openName) {
    return {
      ok: false,
      reason: 'no-open-item',
      headline: 'NO ITEM',
      message: 'No item open in the app',
    }
  }

  const captureKey = input.normalize(captureName)
  const openKey = input.normalize(openName)

  // Not merely a filing question: the stats matcher scores tooltip lines against
  // the *open* item's expected rolls, so reading a capture of a different item
  // would decode it against the wrong vocabulary even if we filed it correctly.
  if (!captureKey || captureKey !== openKey) {
    return {
      ok: false,
      reason: 'mismatch',
      headline: 'WRONG ITEM',
      message: `Captured "${captureName}" but the app now has "${openName}" open - not saved`,
    }
  }

  return { ok: true, itemKey: captureKey }
}
