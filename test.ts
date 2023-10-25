import { VideoMap } from './video.ts'
import { reportChanges } from './reportChanges.ts'

// const listID = 'UUpB959t8iPrxQWj7G6n0ctQ' // wolf
// const listID = 'UUSs7Pue8k9xvqhzEODe9Mnw' // me
// const listID = 'UULFrpiPqqCiX9ua5ob7QNXNJA' // indev
// const listID = 'UULFhQqQvEtHt7MOnTj-cKnq7w' // vgh

const savedData = JSON.parse(await Deno.readTextFile('./data.json'))
const videos = VideoMap.fromData(savedData)

const updates = await videos.update()
await reportChanges(updates)

await Deno.writeTextFile('./data.json', JSON.stringify(videos.toData()))
