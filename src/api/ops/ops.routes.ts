import { Hono } from 'hono'
import * as controller from './ops.controller.ts'

export const routes = new Hono()

// Liveness: "is the process up?"
routes.get('/healthz', controller.health);

// Readiness: "can we serve traffic?"
routes.get('/ready', controller.ready);

routes.get('/info', controller.info);

// Jobs queue status
routes.get('/jobs', controller.jobsStatus);

