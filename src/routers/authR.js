import { Router } from "express";
import { loginUsuario, perfilUsuario } from "../controladores/authconToken.js";


const router = Router();

router.post('/login', loginUsuario);
router.get('/perfil', perfilUsuario);

export default router; 
