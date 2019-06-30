/* eslint-disable linebreak-style */
import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

/**
 * Controllers
 */
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';

/**
 * Middlewares
 */
import authMiddleware from './app/middlewares/auth';

/**
 * Configs
 */
const routes = new Router();
const upload = multer(multerConfig);

/**
 * Routes
 */
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);
routes.post('/appointments', AppointmentController.store);

routes.get('/providers', ProviderController.index);
routes.get('/appointments', AppointmentController.index);
routes.get('/schedule', ScheduleController.index);
routes.get('/notifications', NotificationController.index);

routes.delete('/appointments/:id', AppointmentController.delete);

export default routes;
