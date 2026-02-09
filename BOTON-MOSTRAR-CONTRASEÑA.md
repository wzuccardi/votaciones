# Botón Mostrar/Ocultar Contraseña en Login

## Implementación

Se agregó un botón para mostrar/ocultar la contraseña en el formulario de login, mejorando la experiencia de usuario.

## Cambios Realizados

### Archivo: `src/app/login/page.tsx`

#### 1. Imports Agregados
```typescript
import { Eye, EyeOff } from 'lucide-react'
```

#### 2. Estado Agregado
```typescript
const [showPassword, setShowPassword] = useState(false)
```

#### 3. Campo de Contraseña Actualizado

**Antes**:
```tsx
<Input
  id="password"
  type="password"
  placeholder="Ingresa tu contraseña"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
  minLength={6}
  autoComplete="current-password"
/>
```

**Después**:
```tsx
<div className="relative">
  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    placeholder="Ingresa tu contraseña"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    minLength={6}
    autoComplete="current-password"
    className="pr-10"
  />
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
    onClick={() => setShowPassword(!showPassword)}
    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
  >
    {showPassword ? (
      <EyeOff className="h-4 w-4 text-muted-foreground" />
    ) : (
      <Eye className="h-4 w-4 text-muted-foreground" />
    )}
  </Button>
</div>
```

## Características

### Funcionalidad
- ✅ **Toggle visual**: Cambia entre mostrar y ocultar contraseña
- ✅ **Iconos intuitivos**: 
  - 👁️ `Eye` - Mostrar contraseña
  - 👁️‍🗨️ `EyeOff` - Ocultar contraseña
- ✅ **Posicionamiento**: Botón dentro del input (esquina derecha)
- ✅ **Accesibilidad**: `aria-label` descriptivo

### Diseño
- ✅ **Estilo ghost**: Botón transparente que no distrae
- ✅ **Color muted**: Iconos en color gris suave
- ✅ **Hover sutil**: Sin cambio de fondo al pasar el mouse
- ✅ **Padding ajustado**: Input con `pr-10` para espacio del botón

### UX
- ✅ **Click fácil**: Botón de tamaño adecuado
- ✅ **Feedback visual**: Icono cambia según el estado
- ✅ **No interfiere**: No afecta el flujo del formulario
- ✅ **Responsive**: Funciona en todos los tamaños de pantalla

## Comportamiento

1. **Estado inicial**: Contraseña oculta (type="password")
2. **Al hacer click**: 
   - Cambia a texto visible (type="text")
   - Icono cambia de Eye a EyeOff
3. **Al hacer click nuevamente**:
   - Vuelve a ocultar (type="password")
   - Icono cambia de EyeOff a Eye

## Beneficios

### Para el Usuario
- Puede verificar que escribió correctamente su contraseña
- Reduce errores de tipeo
- Mejora la confianza al ingresar credenciales

### Para la Seguridad
- No compromete la seguridad (el usuario decide cuándo mostrar)
- Útil en entornos privados
- Ayuda a evitar bloqueos por intentos fallidos

### Para la Accesibilidad
- Labels descriptivos para lectores de pantalla
- Botón claramente identificable
- Cumple con estándares WCAG

## Verificación

Para probar la funcionalidad:

1. Ir a `http://localhost:3000/login`
2. Escribir una contraseña en el campo
3. Hacer click en el icono del ojo (👁️)
4. Verificar que la contraseña se muestra en texto plano
5. Hacer click nuevamente en el icono (👁️‍🗨️)
6. Verificar que la contraseña vuelve a ocultarse

## Compatibilidad

- ✅ Todos los navegadores modernos
- ✅ Dispositivos móviles y tablets
- ✅ Lectores de pantalla
- ✅ Teclado (navegación con Tab)

## Estándares Aplicados

- **WCAG 2.1**: Accesibilidad con aria-labels
- **Material Design**: Patrón común de UI
- **Best Practices**: Toggle de contraseña estándar

## Fecha de Implementación
3 de febrero de 2026
