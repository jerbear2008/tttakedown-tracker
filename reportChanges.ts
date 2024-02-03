import { type Embed, post } from './deps.ts'
import config from './config.json' with { type: 'json' }
import { chunkArray, random } from './helpers.ts'
import type { change } from './video.ts'
import { getYouTubeArchives } from './archive.ts'

const botInfo = {
  username: 'TTTakedown Tracker',
  avatar:
    'https://cdn.discordapp.com/attachments/1156660229472264232/1156756524572606556/logo.png',
  github: 'https://github.com/jerbear2008/tttakedown-tracker',
}

const randomQuote = () =>
  random([
    'Bro be usin\' his dog',
    'Bro has a bag',
    'Goonin\' with the boys',
    'Have you no shame?',
    'I can\'t do this no more',
    'Nah, that\'s the Joker. That\'s him.',
    'NEXT TIKTOK',
    'On the bus',
    'Ooooooh nooooooooo',
    'Pathetic, you can do better',
    'That\'s a bowl full of sauce',
    'That\'s gross',
    'This is how they be makin\' the sidewalks',
    'This just be the harsh reality',
    'Well, if it isn\'t the consequences of my own actions',
    'You see this big guy? He be eatin\' aaaall the little guys.',
    'You\'re a liar!',
  ])

export async function reportChanges(changes: change[]) {
  console.log(changes.map(change => `Change: ${change.type} in "${change.video.data.title}"`).join('\n'))

  const embeds = await Promise.all(changes.map(getEmbed))
  const promises: Promise<unknown>[] = []

  for (const chunk of chunkArray(embeds, 10)) {
    for (const webhook of config.reportingWebhooks) {
      promises.push(post(webhook, {
        username: botInfo.username,
        avatar_url: botInfo.avatar,
        embeds: chunk,
      }))
    }
  }
  await Promise.all(promises)
}

export async function getEmbed(change: change): Promise<Embed> {
  const basicDetails = {
    author: {
      name: botInfo.username,
      icon_url: botInfo.avatar,
      url: botInfo.github,
    },
    footer: {
      text: randomQuote(),
    },
  }
  const archiveUrl = await getYouTubeArchives(change.video.data.id) ??
    `https://archive.org/details/youtube-${change.video.data.id}`
  switch (change.type) {
    case 'newVideo':
      return {
        ...basicDetails,
        title: `New Video: "${change.video.data.title}"`,
        url: change.video.url,
        color: 2895153, // transparent, #2c2d31
        fields: [
          {
            name: 'ID',
            value: `\`${change.video.data.id}\``,
            inline: true,
          },
          {
            name: 'Length',
            value: change.video.humanDuration,
            inline: true,
          },
          {
            name: 'Archive',
            value: archiveUrl, // todo: improve
            inline: true,
          },
        ],
        image: {
          url: change.video.data.thumbnailURL,
        },
      }
    case 'removedVideo':
      return {
        ...basicDetails,
        title: `Video Deleted: "${change.video.data.title}"`,
        url: change.video.url,
        color: 15614019, // discord red
        fields: [
          {
            name: 'ID',
            value: `\`${change.video.data.id}\``,
            inline: true,
          },
          {
            name: 'Length',
            value: change.video.humanDuration,
            inline: true,
          },
          {
            name: 'Archive',
            value: archiveUrl, // todo: improve
            inline: true,
          },
        ],
        image: {
          url: change.video.data.thumbnailURL,
        },
      }
    case 'lengthChange':
      return {
        ...basicDetails,
        title: `${
          Math.abs(change.video.data.duration - change.oldDuration)
        } seconds ${
          change.video.data.duration > change.oldDuration ? 'added' : 'removed'
        }: "${change.video.data.title}"`,
        url: change.video.url,
        color: 15982188, // discord yellow
        fields: [
          {
            name: 'ID',
            value: `\`${change.video.data.id}\``,
            inline: true,
          },
          {
            name: 'Old Length',
            value: change.oldHumanDuration,
            inline: true,
          },
          {
            name: 'New Length',
            value: change.video.humanDuration,
            inline: true,
          },
          {
            name: 'Original Archive',
            value: archiveUrl, // todo: improve
            inline: true,
          },
        ],
        image: {
          url: change.video.data.thumbnailURL,
        },
      }
    case 'titleChange':
      return {
        ...basicDetails,
        title: `Title changed: "${change.video.data.title}"`,
        description: `Old title: "${change.oldTitle}"`,
        url: change.video.url,
        color: 14242717, // discord fuchsia
        fields: [
          {
            name: 'ID',
            value: `\`${change.video.data.id}\``,
            inline: true,
          },
          {
            name: 'Length',
            value: change.video.humanDuration,
            inline: true,
          },
          {
            name: 'Archive',
            value: archiveUrl, // todo: improve
            inline: true,
          },
        ],
        image: {
          url: change.video.data.thumbnailURL,
        },
      }
    case 'relistedVideo':
      return {
        ...basicDetails,
        title: `Video relisted: "${change.video.data.title}"`,
        url: change.video.url,
        color: 15982188, // discord yellow
        fields: [
          {
            name: 'ID',
            value: `\`${change.video.data.id}\``,
            inline: true,
          },
          {
            name: 'Length',
            value: change.video.humanDuration,
            inline: true,
          },
          {
            name: 'Archive',
            value: archiveUrl, // todo: improve
            inline: true,
          },
        ],
        image: {
          url: change.video.data.thumbnailURL,
        },
      }
  }
}
