import { Readable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { z } from 'zod'
import { env } from '@/env'
import { generateUniqueFileName } from '@/utils/generateUniqueFileName'
import { r2 } from './client'

const uploadFileToStorageInput = z.object({
  folder: z.enum(['images', 'downloads']),
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type UploadFileToStorageInput = z.input<typeof uploadFileToStorageInput>

export async function uploadFileToStorage(input: UploadFileToStorageInput) {
  const { folder, fileName, contentStream, contentType } =
    uploadFileToStorageInput.parse(input)

  const uniqueFileName = generateUniqueFileName(fileName, folder)

  const upload = new Upload({
    client: r2,
    params: {
      Key: uniqueFileName,
      Bucket: env.CLOUDFLARE_BUCKET,
      Body: contentStream,
      ContentType: contentType,
    },
  })

  await upload.done()

  return {
    key: uniqueFileName,
    url: new URL(uniqueFileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
  }
}
