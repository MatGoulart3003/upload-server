import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { getUploads } from '@/app/services/get-uploads/get-uploads'
import { SortBy, SortDirection } from '@/app/services/get-uploads/types'
import { unwrapEither } from '@/shared/either'

export const getUploadsRoute: FastifyPluginAsyncZod = async server => {
  server.get(
    '/uploads',
    {
      schema: {
        summary: 'Get uploads',
        tags: ['uploads'],
        querystring: z.object({
          searchQuery: z.string().optional(),
          sortBy: z.enum([SortBy.CREATED_AT]).optional(),
          sortOrder: z.enum([SortDirection.ASC, SortDirection.DESC]).optional(),
          page: z.coerce.number().optional().default(1),
          pageSize: z.coerce.number().optional().default(10),
        }),
        response: {
          200: z.object({
            uploads: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                remoteUrl: z.string(),
                createdAt: z.date(),
              }),
            ),
            totalCount: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const result = await getUploads(request.query)

      const { uploads, totalCount } = unwrapEither(result)

      return reply.status(200).send({ uploads, totalCount })
    },
  )
}
