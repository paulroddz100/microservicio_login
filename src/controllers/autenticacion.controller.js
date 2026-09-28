import { z } from 'zod';
import { autenticar } from '../services/autenticacion.service.js';
import { variables } from '../config/entorno.js';

const esquemaCredenciales = z.object({
  nombreUsuario: z
    .string({ error: 'El nombre de usuario es obligatorio' })
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(60, 'El nombre de usuario no puede superar 60 caracteres'),
  contrasena: z
    .string({ error: 'La contrasena es obligatoria' })
    .min(1, 'La contrasena es obligatoria')
    .max(200, 'La contrasena no puede superar 200 caracteres')
});

export async function iniciarSesion(req, res) {
  const credenciales = esquemaCredenciales.parse({
    nombreUsuario: req.body?.nombreUsuario,
    contrasena: req.body?.contrasena
  });

  const resultado = await autenticar(credenciales);

  res.status(200).json({
    exito: true,
    operacion: 'AUTENTICAR_USUARIO',
    mensaje: 'Autenticacion exitosa',
    datos: resultado
  });
}

export function verificarToken(req, res) {
  res.status(200).json({
    exito: true,
    operacion: 'VERIFICAR_TOKEN',
    mensaje: 'Token valido',
    datos: {
      autenticado: true,
      idUsuario: Number(req.usuario.sub),
      nombreUsuario: req.usuario.nombreUsuario,
      rol: req.usuario.rol,
      email: req.usuario.email ?? null
    }
  });
}

export function consultarPerfil(req, res) {
  res.status(200).json({
    exito: true,
    operacion: 'CONSULTAR_PERFIL',
    mensaje: 'Perfil obtenido correctamente',
    datos: {
      idUsuario: Number(req.usuario.sub),
      nombreUsuario: req.usuario.nombreUsuario,
      rol: req.usuario.rol,
      email: req.usuario.email ?? null
    }
  });
}

export function estadoServicio(req, res) {
  res.status(200).json({
    exito: true,
    operacion: 'ESTADO_SERVICIO',
    mensaje: 'Microservicio de login operativo',
    datos: {
      servicio: 'microservicio-login',
      version: '1.0.0',
      entorno: variables.NODE_ENV,
      hora: new Date().toISOString()
    }
  });
}
