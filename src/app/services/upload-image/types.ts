import { Readable } from 'node:stream'
import z from 'zod'

export const uploadImageInput = z.object({
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

export type UploadImageInput = z.input<typeof uploadImageInput>

export interface UploadOutput {
  fileId: string
  fileName: string
  fileUrl: string
}
