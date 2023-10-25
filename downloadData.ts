import { random } from './helpers.ts'

export async function playlistData(listID: string) {
  const downloadCommand = new Deno.Command('yt-dlp', {
    args: [
      '--flat-playlist',
      '--dump-single-json',
      `https://www.youtube.com/playlist?list=${listID}`,
    ],
    stderr: 'inherit',
  })

  const result = await downloadCommand.output()
  if (!result.success) throw new Error('Failed to download data')
  const data = JSON.parse(
    new TextDecoder().decode(result.stdout),
  ) as playlistData

  return data
}

const instancesPromise = (async () => {
  const response = await fetch(
    'https://api.invidious.io/instances.json',
  )
  if (!response.ok) throw new Error('Failed to get instances')
  const instanceData = await response.json() as invidiousInstancesData

  const filteredInstances = instanceData
    .filter(([_domain, data]) =>
      data.api &&
      data.type === 'https' &&
      data.monitor.statusClass === 'success' &&
      data.region === 'US' &&
      Number(data.monitor['30dRatio'].ratio) > 97
    )
    .map(([_domain, data]) => data.uri)
  return filteredInstances
})()

export async function videoData(id: string): Promise<invidiousVideoData> {
  const instance = random(await instancesPromise)
  const response = await fetch(
    new URL(`/api/v1/videos/${id}`, instance),
  )
  if (!response.ok) {
    throw new Error('TODO: handle error')
  }
  const videoData = await response.json() as invidiousVideoData
  return videoData
}

export type playlistData = {
  id: string
  title: string
  availability: string
  channel_follower_count: null
  description: string
  /** assumed */
  tags: string[]
  thumbnails: {
    url: string
    height: number
    width: number
    /** integer, 0-indexed */
    id: string
    /** [integer]x[integer] */
    resolution: string
  }[]

  /** YYYYMMDD */
  modified_date: string
  view_count: number | null
  playlist_count: number
  channel: string
  channel_id: string
  uploader_id: string
  uploader: string
  channel_url: string
  uploader_url: string
  _type: 'playlist'

  entries: {
    id: string
    url: string
    title: string
    /** seconds */
    duration: number
    channel_id: string
    channel: string
    channel_url: string
    uploader: string
    uploader_id: string
    uploader_url: string
    thumbnails: {
      url: string
      height: number
      width: number
    }[]
    view_count: number

    _type: 'url'
    ie_key: 'Youtube'
    description: null
    timestamp: null
    release_timestamp: null
    availability: null
    live_status: null
    channel_is_verified: null
    __x_forwarded_for_ip: null
  }[]

  extractor_key: 'YoutubeTab'
  extractor: 'youtube:tab'
  webpage_url: string
  original_url: string
  webpage_url_basename: string
  webpage_url_domain: string
  epoch: number
  __files_to_move: Record<string, unknown>
  _version: {
    version: string
    current_git_head: null
    release_git_head: string
    repository: 'yt-dlp/yt-dlp'
  }
}

export type invidiousVideoData = {
  title: string
  videoId: string
  videoThumbnails: {
    quality: string
    url: string
    width: number
    height: number
  }[]

  description: string
  descriptionHtml: string
  published: number
  publishedText: string

  keywords: string[]
  viewCount: number
  likeCount: number
  dislikeCount: number

  paid: boolean
  premium: boolean
  isFamilyFriendly: boolean
  allowedRegions: string[]
  genre: string
  genreUrl: string

  author: string
  authorId: string
  authorUrl: string
  authorThumbnails: {
    url: string
    width: number
    height: number
  }[]

  subCountText: string
  lengthSeconds: number
  allowRatings: boolean
  rating: number
  isListed: boolean
  liveNow: boolean
  isUpcoming: boolean
  premiereTimestamp?: number

  hlsUrl?: string
  adaptiveFormats: {
    index: string
    bitrate: string
    init: string
    url: string
    itag: string
    type: string
    clen: string
    lmt: string
    projectionType: number
    container: string
    encoding: string
    qualityLabel?: string
    resolution?: string
  }[]
  formatStreams: {
    url: string
    itag: string
    type: string
    quality: string
    container: string
    encoding: string
    qualityLabel: string
    resolution: string
    size: string
  }[]
  captions: {
    label: string
    languageCode: string
    url: string
  }[]
  recommendedVideos: {
    videoId: string
    title: string
    videoThumbnails: {
      quality: string
      url: string
      width: number
      height: number
    }[]
    author: string
    lengthSeconds: number
    viewCountText: string
  }[]
}

type invidiousInstancesData = [string, {
  flag: string
  region: string
  stats: {
    version: string
    software: {
      name: string
      version: string
      branch: string
    }
    openRegistrations: boolean
    usage: {
      users: {
        total: number
        activeHalfyear: number
        activeMonth: number
      }
    }
    metadata: {
      updatedAt: number
      lastChannelRefreshedAt: number
    }
  }
  cors: boolean
  api: boolean
  type: string
  uri: string
  monitor: {
    monitorId: number
    createdAt: number
    statusClass: string
    name: string
    url: null
    type: string
    dailyRatios: { ratio: string; label: string }[]
    '90dRatio': { ratio: string; label: string }
    '30dRatio': { ratio: string; label: string }
  }
}][]
