export async function downloadData(listID: string, folder: string) {
  try {
    await Deno.remove(folder, { recursive: true })
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error
  }
  await Deno.mkdir(folder)
  const downloadCommand = new Deno.Command('yt-dlp', {
    cwd: folder,
    args: [
      '--flat-playlist',
      '--print-to-file',
      '{"title":"%(title)s","length":"%(duration_string)s","url":"%(webpage_url)s","id":"%(id)s"}',
      '%(id)s.json',
      '--replace-in-metadata',
      'title',
      '"',
      '\\"',
      `https://www.youtube.com/playlist?list=${listID}`,
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  })
  await downloadCommand.output()
}
