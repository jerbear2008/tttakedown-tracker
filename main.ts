import config from './config.json' with { type: 'json' }
import { post } from 'https://deno.land/x/dishooks@v1.1.0/webhook.ts'

async function reportError(error: string) {
  await post(config.debugWebhook, {
    content: '<@787042660724113408> **ERROR IN TTTRACKER**:\n```\n' +
      error + '\n```',
  })
}

async function runScan() {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      'scan.ts',
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const output = await command.output()
  if (!output.success) {
    await reportError(new TextDecoder().decode(output.stderr))
  }
}

globalThis.addEventListener('beforeunload', async (event) => {
  await reportError(
    `TTTracker is shutting down due to a ${event.type} event:\n${
      JSON.stringify(event)
    }`,
  )
})
globalThis.addEventListener('unhandledrejection', async (event) => {
  await reportError(
    `TTTracker encountered an unhandled rejection in the main loop: ${event.promise}\n${
      JSON.stringify(event.reason)
    }`,
  )
})

runScan()
setInterval(runScan, config.scanFrequencyMinutes * 60 * 1000)

console.log('Started!')
