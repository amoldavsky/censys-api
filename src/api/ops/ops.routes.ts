import { Hono } from 'hono'
import * as controller from './ops.controller'

export const routes = new Hono()

// Liveness: "is the process up?"
routes.get('/healthz', controller.health);

// Readiness: "can we serve traffic?"
routes.get('/readyz', controller.ready);

routes.get('/info', controller.info);

// Jobs queue status
routes.get('/jobs', controller.jobsStatus);

