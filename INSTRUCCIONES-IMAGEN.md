# Instrucciones para Agregar la Imagen del Candidato

## Paso 1: Guardar la Imagen

Por favor guarda la imagen del candidato Alonso del Río que compartiste en:

```
public/alonso-del-rio.jpg
```

## Paso 2: Verificar la Implementación

Una vez guardada la imagen, la aplicación mostrará automáticamente:

### En la Página de Login (`/login`):
- ✅ Foto del candidato en el header (esquina superior izquierda)
- ✅ Foto del candidato grande y circular en el formulario de login
- ✅ Nombre: "Alonso del Río"
- ✅ Badge con "Cámara 103"
- ✅ Descripción: "Partido Conservador - Es Confianza"

### En la Página Principal (`/`):
- ✅ Foto del candidato en el header
- ✅ Banner destacado con la foto del candidato (grande)
- ✅ Información completa del candidato
- ✅ Badge con el número 103
- ✅ Badges de "Experiencia", "Compromiso", "Bolívar"

## Cambios Realizados

### Archivos Modificados:
1. `src/app/login/page.tsx` - Página de login con imagen del candidato
2. `src/app/page.tsx` - Página principal con banner del candidato
3. `src/app/dashboard/candidate/page.tsx` - Funcionalidad de reportes PDF completada

### Funcionalidades Agregadas:
- ✅ Imagen del candidato en header y login
- ✅ Banner destacado del candidato en home
- ✅ Generación de reportes PDF (General, Por Líder, Por Municipio)
- ✅ Handlers completos para descarga de PDFs
- ✅ Validaciones y estados de carga

## Próximos Pasos

1. Guarda la imagen en `public/alonso-del-rio.jpg`
2. Reinicia el servidor si está corriendo: `npm run dev`
3. Visita http://localhost:3000 para ver la página principal
4. Visita http://localhost:3000/login para ver el login

## Fallback

Si la imagen no se carga por alguna razón, la aplicación mostrará automáticamente un ícono de respaldo para que no se rompa la interfaz.
