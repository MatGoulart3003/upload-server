import { type Either, makeFailure, makeSuccess } from '@/shared/either'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { InvalidFileFormat } from '../errors/invalid-file-format'
import {
  uploadImageInput,
  type UploadImageInput,
  type UploadOutput,
} from './types'
import { db } from '@/infra/db'

const allowedMimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']

export async function uploadImage(
  input: UploadImageInput,
): Promise<Either<InvalidFileFormat, UploadOutput>> {
  const { contentStream, contentType, fileName } = uploadImageInput.parse(input)

  if (!allowedMimeTypes.includes(contentType)) {
    return makeFailure(new InvalidFileFormat())
  }

  const { key, url } = await uploadFileToStorage({
    fileName,
    contentType,
    contentStream,
    folder: 'images',
  })

  const [upload] = await db
    .insert(schema.uploads)
    .values({
      name: fileName,
      remoteKey: key,
      remoteUrl: url,
    })
    .returning({ id: schema.uploads.id })

  return makeSuccess({ fileId: upload.id, fileName, fileUrl: url })
}
