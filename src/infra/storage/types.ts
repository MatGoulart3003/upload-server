import { Readable } from 'node:stream'
import { z } from 'zod'
import { STORAGE_FOLDERS } from '@/shared/constants'

export const uploadFileToStorageInput = z.object({
  folder: z.enum([STORAGE_FOLDERS.IMAGES, STORAGE_FOLDERS.DOWNLOADS]),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

export type UploadFileToStorageInput = z.input<typeof uploadFileToStorageInput>
