import { randomUUID } from 'node:crypto'
import { basename, extname } from 'node:path'

type Folder = 'images' | 'downloads'

export const generateUniqueFileName = (fileName: string, folder: Folder) => {
  const fileExtension = extname(fileName)
  const fileNameWithoutExtension = basename(fileName)

  const sanitizedFileName = fileNameWithoutExtension.replace(
    /[ˆa-zA-Z0-9]/g,
    '',
  )
  const sanitizedFileNameWithExtension = sanitizedFileName.concat(fileExtension)

  return `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}}`
}
