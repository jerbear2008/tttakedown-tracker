import { type Embed, post } from 'https://deno.land/x/dishooks@v1.1.0/mod.ts'
import { archiveVideo } from './tubeup.ts'
import { getJSONFile, type jsonData } from './helpers.ts'

export async function reportChanges() {
  const fileNames = new Set<string>()
  for (const directory of ['data', 'new-data']) {
    for await (const { name, isFile } of Deno.readDir(directory)) {
      if (isFile) fileNames.add(name)
    }
  }

  const updates: (
    & {
      data: jsonData
      embed: Embed
    }
    & (
      | {
        type: 'new' | 'deleted'
      }
      | {
        type: 'lengthChange' | 'titleChange'
        oldData: jsonData
      }
    )
  )[] = []
  const archivePromises: Promise<unknown>[] = []

  for (const name of fileNames) {
    const oldData = await getJSONFile(`./data/${name}`) as jsonData
    const newData = await getJSONFile(`./new-data/${name}`) as jsonData

    if (!oldData && !newData) {
      console.error(`file ${name} in list but doesn't exist??`)
      continue
    }
    if (!oldData) {
      const archivePromise = archiveVideo(newData.url)
      archivePromises.push(archivePromise)

      updates.push({
        type: 'new',
        data: newData,
        embed: {
          title: `New Video: "${newData.title}"`,
          url: newData.url,
          color: 2895153, // transparent, #2c2d31
          fields: [
            {
              name: 'ID',
              value: `\`${newData.id}\``,
              inline: true,
            },
            {
              name: 'Length',
              value: newData.length,
              inline: true,
            },
            {
              name: 'Archive',
              value: `https://archive.org/details/youtube-${newData.id}`,
              inline: true,
            },
          ],
        },
      })
      continue
    }
    if (!newData) {
      updates.push({
        type: 'deleted',
        data: oldData,
        embed: {
          title: `Video Deleted: "${oldData.title}"`,
          url: oldData.url,
          color: 15614019, // discord red
          fields: [
            {
              name: 'ID',
              value: `\`${oldData.id}\``,
              inline: true,
            },
            {
              name: 'Length',
              value: oldData.length,
              inline: true,
            },
            {
              name: 'Archive',
              value: `https://archive.org/details/youtube-${oldData.id}`,
              inline: true,
            },
          ],
        },
      })
      continue
    }

    if (oldData.length !== newData.length) {
      const parseLength = (str: string) => {
        const parts = str.split(':')
        let length = 0
        parts.forEach((part, i) => {
          const multiplier = Math.pow(60, parts.length - i - 1)
          length += Number(part) * multiplier
        })
        return length
      }
      const removedSeconds = parseLength(oldData.length) -
        parseLength(newData.length)
      updates.push({
        type: 'lengthChange',
        data: newData,
        oldData,
        embed: {
          title: `${Math.abs(removedSeconds)} seconds ${
            removedSeconds >= 0 ? 'removed' : 'added'
          }: "${newData.title}"`,
          url: newData.url,
          color: 15982188, // discord yellow
          fields: [
            {
              name: 'ID',
              value: `\`${newData.id}\``,
              inline: true,
            },
            {
              name: 'Old Length',
              value: oldData.length,
              inline: true,
            },
            {
              name: 'New Length',
              value: newData.length,
              inline: true,
            },
            {
              name: 'Original Archive',
              value: `https://archive.org/details/youtube-${newData.id}`,
              inline: true,
            },
          ],
        },
      })
    }
    if (oldData.title !== newData.title) {
      updates.push({
        type: 'titleChange',
        embed: {
          title: `Title changed: "${newData.title}"`,
          description: `Old title: "${oldData.title}"`,
          url: newData.url,
          color: 14242717, // discord fuchsia
          fields: [
            {
              name: 'ID',
              value: `\`${newData.id}\``,
              inline: true,
            },
            {
              name: 'Length',
              value: newData.length,
              inline: true,
            },
            {
              name: 'Archive',
              value: `https://archive.org/details/youtube-${newData.id}`,
              inline: true,
            },
          ],
        },
        data: newData,
        oldData,
      })
    }
  }
  console.log(updates)

  const webhookString = Deno.env.get('WEBHOOK')
  if (!webhookString) throw new Error('Hey, where\'s the webhook?')
  const webhooks = webhookString.split('\n')

  for (const update of updates) {
    for (const webhook of webhooks) {
      await post(
        webhook,
        {
          username: 'TTTakedown Tracker',
          avatar_url: 'https://cdn.discordapp.com/attachments/1156660229472264232/1156756524572606556/logo.png',
          // content: `\`\`\`json\n${JSON.stringify(update.data, null, 2)}\n\`\`\``, // debug
          embeds: [update.embed],
        },
      )
    }
  }

  await Promise.all(archivePromises)
}
