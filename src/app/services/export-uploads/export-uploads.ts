import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { stringify } from 'csv-stringify'
import { ilike } from 'drizzle-orm'
import { db, pg } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { CSV_CONTENT_TYPE, STORAGE_FOLDERS } from '@/shared/constants'
import { type Either, makeSuccess } from '@/shared/either'
import {
  type ExportUploadsInput,
  type ExportUploadsOutput,
  exportUploadsInput,
} from './types'

const handleTransformCsvChunk = () => {
  return new Transform({
    objectMode: true,
    transform(chunks: unknown[], _encoding, callback) {
      for (const chunk of chunks) {
        this.push(chunk)
      }
      callback()
    },
  })
}

export async function exportUploads(
  input: ExportUploadsInput,
): Promise<Either<never, ExportUploadsOutput>> {
  const { searchQuery } = exportUploadsInput.parse(input)

  const { sql, params } = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined,
    )
    .toSQL()

  const cursor = pg.unsafe(sql, params as string[]).cursor(2)

  const csv = stringify({
    delimiter: ',',
    header: true,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'remote_url', header: 'Remote URL' },
      { key: 'created_at', header: 'Uploaded At' },
    ],
  })

  const uploadToStorageStream = new PassThrough()

  const convertPipelineToCSV = pipeline(
    cursor,
    handleTransformCsvChunk(),
    csv,
    uploadToStorageStream,
  )

  const uploadToStorage = uploadFileToStorage({
    contentStream: uploadToStorageStream,
    folder: STORAGE_FOLDERS.DOWNLOADS,
    fileName: `uploads-report-${new Date().toISOString()}.csv`,
    contentType: CSV_CONTENT_TYPE,
  })

  const [{ url }] = await Promise.all([uploadToStorage, convertPipelineToCSV])

  return makeSuccess({ reportUrl: url })
}
