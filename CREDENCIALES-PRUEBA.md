# 🔑 Credenciales de Prueba

## Usuarios Disponibles para Login

### 👔 Candidato

**Nombre**: Candidato de Prueba Supabase  
**Cédula**: `123456789`  
**Contraseña**: `731026`  
**Rol**: Candidato  
**Partido**: Partido Digital

**Para iniciar sesión**:
1. Ve a http://localhost:3000/login
2. Selecciona rol: "Candidato"
3. Ingresa cédula: `123456789`
4. Ingresa contraseña: `731026`
5. Haz clic en "Iniciar Sesión"

---

### 👥 Líder

**Nombre**: Líder de Prueba Supabase  
**Cédula**: `987654321`  
**Contraseña**: `731026`  
**Rol**: Líder  
**Candidato**: Candidato de Prueba Supabase

**Para iniciar sesión**:
1. Ve a http://localhost:3000/login
2. Selecciona rol: "Líder"
3. Ingresa cédula: `987654321`
4. Ingresa contraseña: `731026`
5. Haz clic en "Iniciar Sesión"

---

## 📊 Datos Disponibles en el Sistema

### Departamento
- **Bolívar** (código: 13)

### Municipios
- **44 municipios** completos de Bolívar
- Incluyendo: CARTAGENA, MAGANGUÉ, TURBACO, ARJONA, etc.

### Puestos de Votación
- **647 puestos** de votación
- Con información completa:
  - Dirección
  - Zona/Comuna
  - Número de mesas
  - Total de votantes (hombres y mujeres)

### Ejemplo de Datos:
- **CARTAGENA**: 138 puestos de votación
- **MAGANGUÉ**: 54 puestos de votación
- **TURBACO**: 17 puestos de votación

---

## 🔧 Comandos Útiles

### Verificar credenciales
```bash
npx tsx scripts/check-credentials.ts
```

### Actualizar contraseñas (a 731026)
```bash
npx tsx scripts/update-passwords.ts
```

### Verificar datos en la base de datos
```bash
npx tsx scripts/verify-data.ts
```

### Ver datos completos importados
```bash
# Ver resumen
cat IMPORTACION-DATOS-COMPLETA.md
```

---

## 🚨 Solución de Problemas

### Error: "Error al iniciar sesión"

**Posibles causas**:
1. Cédula incorrecta
2. Contraseña incorrecta
3. Rol incorrecto
4. Usuario no existe

**Solución**:
```bash
# 1. Verificar que el usuario existe
npx tsx scripts/check-credentials.ts

# 2. Si no existe o la contraseña no funciona
npx tsx scripts/update-passwords.ts

# 3. Intentar login nuevamente
```

### Error: "Cannot connect to database"

**Solución**:
```bash
# Verificar conexión a Supabase
npx prisma db push
```

### No aparecen municipios o puestos en el formulario

**Solución**:
```bash
# 1. Verificar que los datos estén importados
npx tsx scripts/verify-data.ts

# 2. Si no hay datos, importar
npx tsx scripts/import-divipole-completo.ts

# 3. Reiniciar el servidor
npm run dev
```

---

## 📝 Notas

- La contraseña por defecto es `731026` para todos los usuarios
- Las contraseñas están hasheadas con pbkdf2
- Los documentos (cédulas) deben ser solo números
- El rol debe coincidir con el tipo de usuario

---

## 🔐 Seguridad

**Para producción**:
1. Cambia todas las contraseñas
2. Usa contraseñas fuertes (mínimo 8 caracteres)
3. No compartas las credenciales
4. Implementa recuperación de contraseña
5. Habilita autenticación de dos factores

---

**Última actualización**: 30 de enero de 2026  
**Datos importados**: 44 municipios, 647 puestos de votación
