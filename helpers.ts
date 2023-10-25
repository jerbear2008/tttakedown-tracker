/**
 * Pick a random boolean, number, or element from an array
 */
export function random(): boolean
export function random(min: number, max: number): number
export function random<T extends unknown>(arr: T[]): T
export function random(
  minOrArr?: number | unknown[],
  max?: number,
) {
  if (Array.isArray(minOrArr)) {
    return minOrArr[Math.floor(Math.random() * minOrArr.length)]
  } else if (typeof minOrArr === 'number' && typeof max === 'number') {
    return Math.floor(Math.random() * (max - minOrArr)) + minOrArr
  } else {
    return Math.random() < 0.5
  }
}

export function chunkArray<T extends unknown>(arr: T[], chunkSize: number) {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize))
  }
  return chunks
}

// export async function getJSONFile(path: string | URL) {
//   try {
//     const text = await Deno.readTextFile(path)
//     const json = JSON.parse(text)
//     return json
//   } catch (error) {
//     if (!('name' in error && error.name === 'NotFound')) throw error
//     return undefined
//   }
// }
// export type jsonData = {
//   title: string
//   length: string
//   url: string
//   id: string
// }

// export async function fileExists(path: string | URL) {
//   try {
//     await Deno.stat(path)
//     return true
//   } catch (error) {
//     if (!(error instanceof Deno.errors.NotFound)) throw error
//     return false
//   }
// }
