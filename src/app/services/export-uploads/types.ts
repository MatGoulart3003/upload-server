import { PassThrough, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { stringify } from 'csv-stringify'
import { ilike } from 'drizzle-orm'
import z from 'zod'
import { db, pg } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { type Either, makeSuccess } from '@/shared/either'

export const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

export type ExportUploadsInput = z.input<typeof exportUploadsInput>

export interface ExportUploadsOutput {
  reportUrl: string
}

const handleTransformCsvChunk = () => {
  return new Transform({
    objectMode: true,
    transform(chunks: unknown[], _encoding, callback) {
      for (const chunk of chunks) {
        console.log({ chunk })
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
    folder: 'downloads',
    fileName: `uploads-report-${new Date().toISOString()}.csv`,
    contentType: 'text/csv',
  })

  const [{ url }] = await Promise.all([uploadToStorage, convertPipelineToCSV])

  return makeSuccess({ reportUrl: url })
}
