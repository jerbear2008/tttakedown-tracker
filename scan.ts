import { VideoMap } from './video.ts'
import { reportChanges } from './reportChanges.ts'
import config from './config.json' with { type: 'json' }

console.time('Full scan')
await Promise.all(config.channels.map(async ({ name, filename, listID }) => {
  let savedData: ReturnType<typeof VideoMap.prototype.toData> | null = null
  try {
    savedData = JSON.parse(await Deno.readTextFile(`./data/${filename}.json`))
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e
  }
  const videos = VideoMap.fromData(savedData ?? { listID, videos: [] })

  console.time(`Scan and report ${name}`)
  const updates = await videos.update()
  if (savedData) await reportChanges(updates)
  console.timeEnd(`Scan and report ${name}`)

  await Deno.writeTextFile(`./data/${filename}.json`, JSON.stringify(videos.toData()))
}))

console.timeEnd('Full scan')
console.log('Done')