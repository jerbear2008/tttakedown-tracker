import 'https://deno.land/std@0.204.0/dotenv/load.ts'
const disableArchive = false

export async function archiveURL(url: string) {
  if (disableArchive) return console.log('pretend to archive url', url)
  const response = await fetch('https://web.archive.org/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `LOW ${Deno.env.get('IA_S3_KEY')}`,
    },
    body: new URLSearchParams({
      url,
    }),
  })
  if (!response.ok) {
    throw new Error(
      `Failed to archive ${url}: ${response.status} ${response.statusText} ${await response
        .text()}`,
    )
  }
}
export async function archiveYouTubePage(id: string) {
  await archiveURL(`https://www.youtube.com/watch?v=${id}&themeRefresh=1`)
}
export async function archiveYouTubeFile(id: string) {
  if (disableArchive) return console.log('pretend to archive file', id)
  const downloadCommand = new Deno.Command('tubeup', {
    args: [
      // '--metadata=collection:mirrortube',
      `https://www.youtube.com/watch?v=${id}`,
    ],
    stdin: 'inherit',
    stderr: 'inherit',
  })
  await downloadCommand.output()
}

export async function archiveYouTube(id: string) {
  await Promise.all([
    archiveYouTubePage(id),
    archiveYouTubeFile(id),
  ])
}

export async function getYouTubeArchives(id: string) {
  const metadataResponse = await fetch(
    `https://archive.org/metadata/youtube-${id}`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `LOW ${Deno.env.get('IA_S3_KEY')}`,
      },
    },
  )
  if (metadataResponse.ok) {
    const metadataJson = await metadataResponse.json()
    if ('metadata' in metadataJson) {
      const { identifier } = metadataJson.metadata as { identifier: string }
      return `https://archive.org/details/${identifier}`
    }
  }

  const availibilityUrl = new URL(
    'https://archive.org/wayback/available',
  )
  availibilityUrl.searchParams.set(
    'url',
    `https://www.youtube.com/watch?v=${id}`,
  )
  const availibilityResponse = await fetch(
    availibilityUrl.href,
    {
      headers: {
        'Accept': 'application/json',
        // 'Authorization': `LOW ${Deno.env.get('IA_S3_KEY')}`,
      },
    },
  )
  if (availibilityResponse.ok) {
    const availibilityJson = await availibilityResponse.json() as {
      url: string
      archived_snapshots: Record<string, never> | {
        closest: {
          status: string
          available: boolean
          url: string
          timestamp: string
        }
      }
    }
    if (availibilityJson.archived_snapshots.closest) {
      const { url } = availibilityJson.archived_snapshots.closest
      return url as string
    }
  }

  // return `https://archive.org/details/youtube-${id}`
  return null
}
