import { asc, count, desc, ilike } from 'drizzle-orm'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeSuccess } from '@/shared/either'
import {
  type GetUploadsInput,
  type GetUploadsOutput,
  getUploadsInput,
  type Upload,
} from './types'

export async function getUploads(
  input: GetUploadsInput,
): Promise<Either<never, GetUploadsOutput>> {
  const { page, pageSize, searchQuery, sortBy, sortOrder } =
    getUploadsInput.parse(input)

  const [uploads, [{ totalCount }]] = await Promise.all([
    db
      .select({
        id: schema.uploads.id,
        name: schema.uploads.name,
        remoteUrl: schema.uploads.remoteUrl,
        createdAt: schema.uploads.createdAt,
      })
      .from(schema.uploads)
      .where(
        searchQuery
          ? ilike(schema.uploads.name, `%${searchQuery}%`)
          : undefined,
      )
      .orderBy(fields => {
        if (sortBy) {
          if (sortOrder === 'asc') {
            return asc(fields[sortBy])
          } else {
            return desc(fields[sortBy])
          }
        }

        return desc(fields.id)
      })
      .offset((page - 1) * pageSize)
      .limit(pageSize) as unknown as Upload[],

    db
      .select({ totalCount: count(schema.uploads.id) })
      .from(schema.uploads)
      .where(
        searchQuery
          ? ilike(schema.uploads.name, `%${searchQuery}%`)
          : undefined,
      ),
  ])

  return makeSuccess({
    uploads,
    totalCount: Number(totalCount),
  })
}
