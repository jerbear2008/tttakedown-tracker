import { downloadData } from './downloadData.ts'
import { reportChanges } from './reportChanges.ts'
import { fileExists } from './helpers.ts'

const listID = Deno.env.get('LIST_ID')
if (!listID) throw new Error('Hey, I need a list id to check')
await downloadData(listID, 'new-data')

if (await fileExists('data')) {
  await reportChanges()
  await Deno.remove('data', { recursive: true })
}

await Deno.rename('new-data', 'data')