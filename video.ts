import { archiveYouTube, archiveYouTubeFile, archiveYouTubePage } from './archive.ts'
import { invidiousVideoData, playlistData, videoData } from './downloadData.ts'

type playlistEntriesData = playlistData['entries']
type playlistEntryData = playlistData['entries'][number]

export type change =
  & { video: Video }
  & ({
    type: 'newVideo' | 'removedVideo' | 'relistedVideo'
  } | {
    type: 'lengthChange'
    oldDuration: number
    oldHumanDuration: string
  } | {
    type: 'titleChange'
    oldTitle: string
  })

export class VideoMap extends Map<string, Video> {
  constructor(public listID: string) {
    super()
  }

  async update() {
    const publicVideos = (await playlistData(this.listID)).entries
    const changes: change[] = []
    for (const video of publicVideos) {
      const existingVideo = this.get(video.id)
      if (existingVideo) {
        changes.push(...existingVideo.update(Video.playlistEntryToData(video)))
        continue
      }

      const newVideo = new Video(Video.playlistEntryToData(video))
      this.set(video.id, newVideo)
      changes.push(newVideo.setNew())
    }
    const removedVideos = [...this.values()].filter((video) =>
      !publicVideos.find((entry) => entry.id === video.data.id)
    )
    for (const video of removedVideos) {
      const newData = Video.invidiousVideoToData(await videoData(video.data.id))
      const updates = video.update(newData)
      if (updates.length) changes.push(...updates)
    }

    return changes
  }

  toData() {
    return {
      listID: this.listID,
      videos: [...this.values()].map((video) => video.toData()),
    }
  }
  static fromData(data: ReturnType<typeof VideoMap.prototype.toData>) {
    const videoMap = new VideoMap(data.listID)
    for (const videoData of data.videos) {
      videoMap.set(videoData.id, Video.fromData(videoData))
    }
    return videoMap
  }
}

const bestThumbnail = (thumbnails: {
  url: string
  width: number
}[]) =>
  thumbnails.reduce((prev, curr) => {
    if (prev.width > curr.width) return prev
    return curr
  }).url
export type videoData = {
  id: string
  title: string
  thumbnailURL: string
  duration: number
  listed: boolean
  views?: number
  channelName?: string
  channelURL?: string
}

export class Video {
  constructor(
    public data: videoData,
  ) {}

  update(data: videoData) {
    const changes: change[] = []
    let archivePage = false
    if (this.data.listed !== data.listed) {
      changes.push({
        type: data.listed ? 'relistedVideo' as const : 'removedVideo' as const,
        video: this,
      })
      archivePage = true
    }
    if (this.data.duration !== data.duration) {
      changes.push({
        type: 'lengthChange' as const,
        video: this,
        oldDuration: this.data.duration,
        oldHumanDuration: this.humanDuration,
      })
      archivePage = true
    }
    if (this.data.title !== data.title) {
      changes.push({
        type: 'titleChange' as const,
        video: this,
        oldTitle: this.data.title,
      })
      archivePage = true
    }

    this.data = data
    if (archivePage) archiveYouTubePage(this.data.id)

    return changes
  }
  static playlistEntryToData(playlistEntry: playlistEntryData): videoData {
    return {
      id: playlistEntry.id,
      title: playlistEntry.title,
      thumbnailURL: bestThumbnail(playlistEntry.thumbnails),
      duration: playlistEntry.duration,
      views: playlistEntry.view_count,
      channelName: playlistEntry.channel,
      channelURL: playlistEntry.channel_url,
      listed: true,
    }
  }
  static invidiousVideoToData(invidiousVideo: invidiousVideoData): videoData {
    return {
      id: invidiousVideo.videoId,
      title: invidiousVideo.title,
      thumbnailURL: bestThumbnail(invidiousVideo.videoThumbnails),
      duration: invidiousVideo.lengthSeconds,
      views: invidiousVideo.viewCount,
      channelName: invidiousVideo.author,
      channelURL: invidiousVideo.authorUrl,
      listed: invidiousVideo.isListed,
    }
  }

  setNew() {
    this.data.listed = true
    archiveYouTube(this.data.id)
    
    return {
      type: 'newVideo' as const,
      video: this,
    }
  }

  get url() {
    return `https://youtu.be/${this.data.id}`
  }
  get humanDuration() {
    const hours = Math.floor(this.data.duration / 3600)
    const minutes = Math.floor(this.data.duration / 60) % 60
    const seconds = this.data.duration % 60

    const hoursString = hours ? `${hours}:` : ''
    const minutesString = hours ? `${minutes}`.padStart(2, '0') : `${minutes}`
    const secondsString = `${seconds}`.padStart(2, '0')

    return `${hoursString}${minutesString}:${secondsString}`
  }

  toString() {
    return `Video ["${
      this.data.title.replaceAll('"', '\\"')
    }" ${this.humanDuration} ${this.data.id}]`
  }
  toData() {
    return this.data
  }
  static fromData(data: videoData) {
    return new Video(data)
  }
}
