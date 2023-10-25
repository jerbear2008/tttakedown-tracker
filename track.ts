import { VideoMap } from './video.ts'
import { reportChanges } from './reportChanges.ts'

const channels = [
  {
    name: 'SSSniperWolf',
    filename: 'sssniperwolf',
    listID: 'UUpB959t8iPrxQWj7G6n0ctQ',
  },
  {
    name: 'SSSniperWolf Top Videos',
    filename: 'sssniperwolf-top-videos',
    listID: 'UULFGovFxnYvAR_OozTMzQqt3A',
  },
  {
    name: 'Little Lia',
    filename: 'little-lia',
    listID: 'UULF2hFZwNM71iOOCY3guLE7KQ',
  }
]

// deno-lint-ignore no-unused-vars
await Promise.all(channels.map(async ({ name, filename, listID }) => {
  let savedData: ReturnType<typeof VideoMap.prototype.toData> | null = null
  try {
    savedData = JSON.parse(await Deno.readTextFile(`./data/${filename}.json`))
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e
  }
  const videos = VideoMap.fromData(savedData ?? { listID, videos: [] })

  const updates = await videos.update()
  if (savedData) await reportChanges(updates)

  await Deno.writeTextFile(`./data/${filename}.json`, JSON.stringify(videos.toData()))
}))

console.log('Done')