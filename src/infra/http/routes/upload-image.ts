import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { InvalidFileFormat } from '@/app/services/errors/invalid-file-format'
import { uploadImage } from '@/app/services/upload-image/upload-image'
import { MAX_FILE_SIZE } from '@/shared/constants'
import { isSuccess, unwrapEither } from '@/shared/either'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        tags: ['uploads'],
        consumes: ['multipart/form-data'],
        response: {
          201: z.object({
            uploadId: z.string(),
            fileName: z.string(),
            fileUrl: z.string().url(),
          }),
          400: z.object({ message: z.string() }),
          409: z
            .object({ message: z.string() })
            .describe('Upload already exists.'),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          fileSize: MAX_FILE_SIZE,
        },
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required' })
      }

      const result = await uploadImage({
        fileName: uploadedFile?.filename,
        contentType: uploadedFile?.mimetype,
        contentStream: uploadedFile.file,
      })

      if (isSuccess(result)) {
        return reply.status(201).send({
          uploadId: result.success.fileId,
          fileName: result.success.fileName,
          fileUrl: result.success.fileUrl,
        })
      }

      const error = unwrapEither(result)

      if (error instanceof InvalidFileFormat) {
        return reply.status(400).send({ message: error.message })
      }
    },
  )
}
