import { ilike } from 'drizzle-orm'
import z from 'zod'
import { db, pg } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeSuccess } from '@/shared/either'

export const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

export type ExportUploadsInput = z.input<typeof exportUploadsInput>

export interface ExportUploadsOutput {
  reportUrl: string
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

  const cursor = pg.unsafe(sql, params as string[]).cursor(50)

  return makeSuccess({ reportUrl: 'https://example.com/report.csv' })
}
