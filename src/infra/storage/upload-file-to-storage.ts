import { Upload } from '@aws-sdk/lib-storage'
import { env } from '@/env'
import { generateUniqueFileName } from '@/utils/generateUniqueFileName'
import {
  type UploadFileToStorageInput,
  uploadFileToStorageInput,
} from './types'
import { r2 } from './client'

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
