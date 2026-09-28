import { variables } from '../config/entorno.js';
import { firmarToken, segundosDeVigencia } from '../utils/jwt.js';
import { generarHashDePrueba, verificarPassword } from '../utils/passwords.js';
import { ErrorAplicacion, ErrorCredenciales } from '../utils/errores.js';
import { logger } from '../utils/logger.js';
import {
  buscarUsuarioPorNombre,
  registrarAcceso,
  registrarIntentoFallido
} from '../repositories/usuarios.repository.js';

const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;

const hashDeComparacion = generarHashDePrueba('comparacion-para-igualar-tiempos');

function estaBloqueado(usuario) {
  if (!usuario.bloqueadoHasta) return false;
  return new Date(usuario.bloqueadoHasta).getTime() > Date.now();
}

function mensajeBloqueo(usuario) {
  const minutos = Math.max(
    1,
    Math.ceil((new Date(usuario.bloqueadoHasta).getTime() - Date.now()) / 60000)
  );
  return `Usuario bloqueado temporalmente por intentos fallidos. Intente nuevamente en ${minutos} minuto(s).`;
}

function datosPublicos(usuario, token) {
  return {
    idUsuario: usuario.id,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email ?? null,
    nombreCompleto: usuario.nombreCompleto ?? null,
    rol: usuario.rol,
    ultimoAcceso: usuario.ultimoAcceso ?? null
  };
}

export async function autenticar({ nombreUsuario, contrasena }) {
  const usuario = await buscarUsuarioPorNombre(nombreUsuario);

  if (!usuario) {
    await verificarPassword(contrasena, await hashDeComparacion);
    logger.warn(`Intento de autenticacion con usuario inexistente: "${nombreUsuario}"`);
    throw new ErrorCredenciales();
  }

  if (estaBloqueado(usuario)) {
    throw new ErrorAplicacion(mensajeBloqueo(usuario), {
      estadoHttp: 423,
      codigo: 'USUARIO_BLOQUEADO'
    });
  }

  if (!usuario.activo) {
    logger.warn(`Intento de autenticacion de usuario inactivo: "${nombreUsuario}"`);
    throw new ErrorAplicacion('El usuario esta inactivo. Contacte al administrador.', {
      estadoHttp: 403,
      codigo: 'USUARIO_INACTIVO'
    });
  }

  const coincide = await verificarPassword(contrasena, usuario.passwordHash);

  if (!coincide) {
    await registrarIntentoFallido(usuario.id, MAX_INTENTOS_FALLIDOS, MINUTOS_BLOQUEO);
    logger.warn(`Contrasena incorrecta para el usuario "${nombreUsuario}" (id ${usuario.id}).`);
    throw new ErrorCredenciales();
  }

  await registrarAcceso(usuario.id);

  const token = firmarToken(usuario);
  const segundos = segundosDeVigencia();

  logger.info(`Autenticacion exitosa del usuario "${nombreUsuario}" (id ${usuario.id}, rol ${usuario.rol}).`);

  return {
    ...datosPublicos(usuario),
    autenticado: true,
    token,
    tipoToken: 'Bearer',
    expiraEn: segundos,
    expiraEnTexto: variables.JWT_EXPIRES_IN
  };
}
