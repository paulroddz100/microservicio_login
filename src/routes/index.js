import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  estadoServicio,
  iniciarSesion,
  verificarToken,
  consultarPerfil
} from '../controllers/autenticacion.controller.js';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion.js';
import { controlAsincrono } from '../middlewares/controlAsincrono.js';
import { variables } from '../config/entorno.js';
import { verificarMySQL } from '../config/baseDatos.js';

const router = Router();

const limiteIntentos = rateLimit({
  windowMs: variables.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: variables.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => variables.NODE_ENV === 'test',
  message: {
    exito: false,
    codigo: 'LIMITE_INTENTOS',
    mensaje: 'Demasiados intentos de autenticacion. Espere unos minutos antes de volver a intentar.'
  }
});

router.get('/estado', (req, res) => estadoServicio(req, res));

router.get('/salud', controlAsincrono(async (req, res) => {
  const baseDatos = await verificarMySQL();
  res.status(baseDatos.conectado ? 200 : 503).json({
    exito: baseDatos.conectado,
    operacion: 'COMPROBAR_SALUD',
    mensaje: baseDatos.conectado ? 'Servicio y base de datos disponibles' : 'Servicio activo sin conexion a MySQL',
    datos: { baseDatos }
  });
}));

router.post('/auth/login', limiteIntentos, controlAsincrono(iniciarSesion));

router.get('/auth/verificar', requiereAutenticacion, verificarToken);

router.get('/auth/perfil', requiereAutenticacion, consultarPerfil);

router.get('/auth/admin/panel', requiereAutenticacion, requiereRol('ADMIN'), (req, res) => {
  res.status(200).json({
    exito: true,
    operacion: 'PANEL_ADMIN',
    mensaje: 'Acceso permitido a usuarios con rol ADMIN',
    datos: { idUsuario: Number(req.usuario.sub) }
  });
});

export default router;
