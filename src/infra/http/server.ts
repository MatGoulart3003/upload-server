import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import { env } from '@/env'
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod'
import { uploadImageRoute } from './routes/upload-image'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler((error, _request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.validation,
    })
  }

  console.error(error)
  return reply.status(500).send({ message: 'Internal Server Error' })
})

server.register(fastifyCors, {
  origin: '*',
})

console.log(env.DATABASE_URL)

server.register(uploadImageRoute)

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log(`HTTP server is running on http://localhost:3333`)
})
