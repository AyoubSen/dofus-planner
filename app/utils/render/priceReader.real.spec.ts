import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { atlasReadiness, buildAtlasFromSamples } from './atlasFromCorpus'
import { readPrice } from './priceReader'
import { toGrayImage } from './reconstruct'
import { upperBound95 } from './selectiveRisk'

// The question the whole project turns on: does reconstruction read real Dofus
// prices, and when it declines, does it decline rather than guess?
//
// Leave-one-out: each sample is read with an atlas built from the *other*
// samples, so no capture is ever graded against glyphs cut from itself. Without
// that, a perfect score would prove only that the extractor can put a glyph
// back where it found it.

const CORPUS = 'corpus'
const hasCorpus = existsSync(CORPUS) && readdirSync(CORPUS).length > 0

interface Loaded {
  id: string
  profileId: string
  colour: { width: number; height: number; data: Uint8ClampedArray }
  gray: ReturnType<typeof toGrayImage>
  truth: number
}

const load = async (): Promise<Loaded[]> => {
  const sharp = (await import('sharp')).default
  const out: Loaded[] = []

  for (const dir of readdirSync(CORPUS)) {
    const manifestPath = join(CORPUS, dir, 'sample.json')
    const stripPath = join(CORPUS, dir, 'strip.png')
    if (!existsSync(manifestPath) || !existsSync(stripPath)) continue
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (typeof manifest.truth !== 'number') continue

    const { data, info } = await sharp(stripPath).ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true })
    const bytes = new Uint8ClampedArray(data)
    out.push({
      id: dir,
      profileId: `${manifest.profile?.screenWidth ?? 0}x${manifest.profile?.screenHeight ?? 0}@${manifest.profile?.devicePixelRatio ?? 1}`,
      colour: { width: info.width, height: info.height, data: bytes },
      gray: toGrayImage(bytes, info.width, info.height),
      truth: manifest.truth,
    })
  }

  return out
}

const frenchTruth = (value: number) => value.toLocaleString('fr-FR').replace(/ | /g, ' ')

describe.skipIf(!hasCorpus)('reading real prices', () => {
  it('reads correctly or refuses, never wrongly', async () => {
    const samples = await load()
    expect(samples.length).toBeGreaterThan(0)

    let correct = 0
    let refused = 0
    const wrong: string[] = []
    const details: string[] = []
    const skippedProfiles = new Set<string>()

    for (const target of samples) {
      // Atlas from every other sample *of the same profile*. The held-out one
      // contributes nothing, and neither does any capture at a different
      // resolution: glyphs differ between profiles, so averaging across them
      // produces a blur that matches nothing well and reads confidently wrong.
      // Mixing them here produced five false accepts — the builder already
      // partitions by profile, and the test has to respect the same rule or it
      // grades a model nobody would ever ship.
      const others = samples.filter(
        (sample) => sample.id !== target.id && sample.profileId === target.profileId,
      )
      if (others.length < 4) continue
      const built = buildAtlasFromSamples(
        others.map((sample) => ({
          colour: sample.colour,
          image: sample.gray,
          truth: frenchTruth(sample.truth),
        })),
        'dofus-1920x1080',
      )

      // Grade only what would actually be used. An atlas that fails its
      // readiness bar is never loaded by the app, so reading with it here would
      // measure a configuration that cannot ship — and it did: three false
      // accepts, all from a profile whose atlas rested on single examples of
      // some digits and is refused at load time for exactly that reason.
      if (!atlasReadiness(built).ready) {
        skippedProfiles.add(target.profileId)
        continue
      }

      const reading = readPrice(target.colour, { atlas: built.atlas })

      if (reading.value === null) refused += 1
      else if (reading.value === target.truth) correct += 1
      else wrong.push(`${target.id} read ${reading.value} truth ${target.truth}`)

      details.push([
        target.id.slice(11, 19),
        `truth=${target.truth}`,
        `read=${reading.value ?? '-'}`,
        `text=${reading.text}`,
        `res=${reading.residual.toFixed(3)}`,
        `mar=${reading.margin === Infinity ? 'inf' : reading.margin.toFixed(3)}`,
        reading.reason,
      ].join(' '))
    }

    const answered = correct + wrong.length
    writeFileSync('reader-report.txt', [
      `samples ${samples.length} | correct ${correct} | wrong ${wrong.length} | refused ${refused}`,
      `coverage ${((answered / samples.length) * 100).toFixed(1)}%`,
      `false-accept <= ${(upperBound95(wrong.length, answered) * 100).toFixed(2)}% at 95%`,
      `profiles skipped for an unready atlas: ${[...skippedProfiles].join(', ') || 'none'}`,
      '',
      ...wrong.map((line) => 'WRONG ' + line),
      '',
      ...details,
    ].join('\n'))

    // The one property that is not negotiable. Coverage is allowed to be poor;
    // being confidently wrong is not.
    expect(wrong, wrong.join('; ')).toHaveLength(0)
  }, 300_000)
})
