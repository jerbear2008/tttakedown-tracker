export async function getJSONFile(path: string | URL) {
  try {
    const text = await Deno.readTextFile(path)
    const json = JSON.parse(text)
    return json
  } catch (error) {
    if (!('name' in error && error.name === 'NotFound')) throw error
    return undefined
  }
}
export type jsonData = {
  title: string
  length: string
  url: string
  id: string
}

export async function fileExists(path: string | URL) {
  try {
    await Deno.stat(path)
    return true
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error
    return false
  }
}