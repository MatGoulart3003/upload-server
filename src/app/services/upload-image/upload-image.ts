import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { ALLOWED_MIME_TYPES, STORAGE_FOLDERS } from '@/shared/constants'
import { type Either, makeFailure, makeSuccess } from '@/shared/either'
import { InvalidFileFormat } from '../errors/invalid-file-format'
import {
  type UploadImageInput,
  type UploadOutput,
  uploadImageInput,
} from './types'

export async function uploadImage(
  input: UploadImageInput,
): Promise<Either<InvalidFileFormat, UploadOutput>> {
  const { contentStream, contentType, fileName } = uploadImageInput.parse(input)

  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return makeFailure(new InvalidFileFormat())
  }

  const { key, url } = await uploadFileToStorage({
    fileName,
    contentType,
    contentStream,
    folder: STORAGE_FOLDERS.IMAGES,
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
