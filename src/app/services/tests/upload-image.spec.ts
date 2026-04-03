import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { isFailure, isSuccess, unwrapEither } from '@/shared/either'
import { uploadImage } from '../upload-image'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { eq } from 'drizzle-orm'
import { InvalidFileFormat } from '../errors/invalid-file-format'

describe('upload image', async () => {
  beforeAll(() => {
    vi.mock('@/infra/storage/upload-file-to-storage', () => {
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: `images/${randomUUID()}.jpg`,
            url: `https://upload-server.test/images/${randomUUID()}.jpg`,
          }
        }),
      }
    })
  })

  it('should upload an image successfully', async () => {
    const fileName = `${randomUUID()}.png`

    // SYSTEM UNDER TEST: Variável que estou testando
    const sut = await uploadImage({
      fileName: fileName,
      contentStream: Readable.from([]),
      contentType: 'image/png',
    })
    expect(isSuccess(sut)).toBe(true)

    const result = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.name, fileName))

    expect(result.length).toBe(1)
  })

  it('should not upload an invalid file', async () => {
    const fileName = `${randomUUID()}.pdf`

    // SYSTEM UNDER TEST: Variável que estou testando
    const sut = await uploadImage({
      fileName: fileName,
      contentStream: Readable.from([]),
      contentType: 'image/pdf',
    })
    expect(isFailure(sut)).toBe(true)

    expect(unwrapEither(sut)).toBeInstanceOf(InvalidFileFormat)
  })
})
