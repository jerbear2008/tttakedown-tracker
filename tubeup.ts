export async function archiveVideo(url: string | URL) {
  const href = url instanceof URL ? url.href : url
  const downloadCommand = new Deno.Command('tubeup', {
    args: [href],
  })
  await downloadCommand.output()
}
