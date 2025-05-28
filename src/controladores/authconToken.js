import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { conmysql } from "../bd.js";


export const loginUsuario = async (req, res) => {
  const { usr_usuario, usr_clave } = req.body;

  if (!usr_usuario || !usr_clave) {
    return res.status(400).json({ error: "Usuario y clave son requeridos" });
  }

  try {
    const [rows] = await conmysql.query("SELECT * FROM usuarios WHERE usr_usuario = ?", [usr_usuario]);
   
    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = rows[0];



    const validPassword = await bcrypt.compare(usr_clave, user.usr_clave);
    
    const password = '123456';
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;
      console.log('Hash_hola:', hash);
    });

    if (!validPassword) {
      
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    if (!process.env.JWT_CLAVE_PRIVADA) {
      
      return res.status(500).json({ error: "JWT no configurado" });
    }

    const jwtConstructor = new SignJWT({ usr_id: user.usr_id });
    const encoder = new TextEncoder();
    const token = await jwtConstructor
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encoder.encode(process.env.JWT_CLAVE_PRIVADA));

    return res.json({ token });
    
  } catch (error) {
    console.error("Error general:", error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export const perfilUsuario = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    if (!process.env.JWT_CLAVE_PRIVADA) {
      console.error("JWT_PRIVATE_KEY no definida");
      return res.status(500).json({ error: "JWT no configurado" });
    }

    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(
      authorization,
      encoder.encode(process.env.JWT_CLAVE_PRIVADA)
    );

    const [results] = await conmysql.query("SELECT * FROM usuarios WHERE usr_id = ?", [payload.usr_id]);

    if (results.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    return res.json(results[0]);

  } catch (error) {
    console.error("Error en verificación del token:", error);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
