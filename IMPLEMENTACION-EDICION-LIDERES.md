# Implementación de Edición de Líderes y Sublíderes

## Cambios Realizados

### 1. Endpoint API Actualizado
**Archivo:** `src/app/api/dashboard/candidate/leaders/route.ts`

Se agregaron dos nuevos métodos:

#### PUT - Actualizar Líder
- Permite actualizar nombre, documento, contraseña y líder padre
- Valida que el líder pertenezca al candidato
- Verifica duplicados de documento
- Actualiza el índice de documentos
- Permite cambiar la jerarquía (líder principal ↔ sublíder)

#### DELETE - Eliminar Líder
- Valida que el líder pertenezca al candidato
- Verifica que no tenga sublíderes
- Verifica que no tenga votantes
- Elimina el índice de documentos
- Elimina el líder de la base de datos

### 2. Componente LeaderTreeNode Actualizado

Se agregaron botones de acción en cada líder:
- **Botón Editar** (ícono de lápiz)
- **Botón Eliminar** (ícono de papelera)

### 3. Diálogo de Edición

Formulario con los siguientes campos:
- **Nombre completo** (requerido)
- **Documento** (requerido)
- **Nueva contraseña** (opcional)
- **Líder padre** (opcional, para convertir en sublíder o cambiar jerarquía)

### 4. Diálogo de Confirmación de Eliminación

Muestra:
- Nombre del líder a eliminar
- Advertencias si tiene sublíderes o votantes
- Botón de confirmación

## Código a Agregar

### En el componente LeaderTreeNode

```typescript
// Agregar props adicionales
function LeaderTreeNode({ 
  leader, 
  level, 
  expandedLeaderId, 
  toggleLeaderExpansion, 
  leaderVoters,
  onEditLeader,      // NUEVO
  onDeleteLeader     // NUEVO
}: { 
  leader: any
  level: number
  expandedLeaderId: string | null
  toggleLeaderExpansion: (id: string) => void
  leaderVoters: Record<string, Voter[]>
  onEditLeader: (leader: any) => void      // NUEVO
  onDeleteLeader: (leader: any) => void    // NUEVO
}) {
  // ... código existente ...
  
  // En la sección de botones, agregar:
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="text-xs">
      {leader._count?.voters || 0} votantes
    </Badge>
    {hasSubLeaders && (
      <Badge variant="outline" className="text-xs bg-primary/10">
        {leader.subLeaders.length} sublíderes
      </Badge>
    )}
    
    {/* NUEVOS BOTONES */}
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={(e) => {
        e.stopPropagation()
        onEditLeader(leader)
      }}
    >
      <Pencil className="h-3 w-3" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation()
        onDeleteLeader(leader)
      }}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
    
    <Button 
      variant="ghost" 
      size="sm"
      className="h-6 w-6 p-0"
    >
      {isExpanded ? '▼' : '▶'}
    </Button>
  </div>
}
```

### Estados Adicionales en el Componente Principal

```typescript
const [isEditLeaderDialogOpen, setIsEditLeaderDialogOpen] = useState(false)
const [isDeleteLeaderDialogOpen, setIsDeleteLeaderDialogOpen] = useState(false)
const [selectedLeaderForEdit, setSelectedLeaderForEdit] = useState<any>(null)
const [selectedLeaderForDelete, setSelectedLeaderForDelete] = useState<any>(null)
const [editLeaderForm, setEditLeaderForm] = useState({
  name: '',
  document: '',
  password: '',
  parentLeaderId: ''
})
const [isSubmittingLeader, setIsSubmittingLeader] = useState(false)
```

### Funciones de Manejo

```typescript
const handleEditLeader = (leader: any) => {
  setSelectedLeaderForEdit(leader)
  setEditLeaderForm({
    name: leader.name,
    document: leader.document,
    password: '',
    parentLeaderId: leader.parentLeaderId || ''
  })
  setIsEditLeaderDialogOpen(true)
}

const handleDeleteLeader = (leader: any) => {
  setSelectedLeaderForDelete(leader)
  setIsDeleteLeaderDialogOpen(true)
}

const submitEditLeader = async () => {
  if (!selectedLeaderForEdit || !editLeaderForm.name || !editLeaderForm.document) {
    toast.error('Por favor completa todos los campos requeridos')
    return
  }

  setIsSubmittingLeader(true)
  try {
    const response = await fetch('/api/dashboard/candidate/leaders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaderId: selectedLeaderForEdit.id,
        name: editLeaderForm.name,
        document: editLeaderForm.document,
        password: editLeaderForm.password || undefined,
        parentLeaderId: editLeaderForm.parentLeaderId || null
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success('Líder actualizado exitosamente')
      setIsEditLeaderDialogOpen(false)
      setSelectedLeaderForEdit(null)
      setEditLeaderForm({ name: '', document: '', password: '', parentLeaderId: '' })
      // Recargar líderes
      fetchData(currentUser.id)
    } else {
      toast.error(data.message || 'Error al actualizar el líder')
    }
  } catch (error) {
    console.error('Error updating leader:', error)
    toast.error('Error al actualizar el líder')
  } finally {
    setIsSubmittingLeader(false)
  }
}

const confirmDeleteLeader = async () => {
  if (!selectedLeaderForDelete) return

  setIsSubmittingLeader(true)
  try {
    const response = await fetch('/api/dashboard/candidate/leaders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaderId: selectedLeaderForDelete.id
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success('Líder eliminado exitosamente')
      setIsDeleteLeaderDialogOpen(false)
      setSelectedLeaderForDelete(null)
      // Recargar líderes
      fetchData(currentUser.id)
    } else {
      toast.error(data.message || 'Error al eliminar el líder')
    }
  } catch (error) {
    console.error('Error deleting leader:', error)
    toast.error('Error al eliminar el líder')
  } finally {
    setIsSubmittingLeader(false)
  }
}
```

### Diálogo de Edición (JSX)

```typescript
{/* Diálogo de Edición de Líder */}
<Dialog open={isEditLeaderDialogOpen} onOpenChange={setIsEditLeaderDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Editar Líder</DialogTitle>
      <DialogDescription>
        Actualiza la información del líder
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Nombre Completo *</Label>
        <Input
          id="edit-name"
          value={editLeaderForm.name}
          onChange={(e) => setEditLeaderForm({ ...editLeaderForm, name: e.target.value })}
          placeholder="Nombre completo"
        />
      </div>
      
      <div>
        <Label htmlFor="edit-document">Documento *</Label>
        <Input
          id="edit-document"
          value={editLeaderForm.document}
          onChange={(e) => setEditLeaderForm({ ...editLeaderForm, document: e.target.value })}
          placeholder="Número de documento"
        />
      </div>
      
      <div>
        <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
        <Input
          id="edit-password"
          type="password"
          value={editLeaderForm.password}
          onChange={(e) => setEditLeaderForm({ ...editLeaderForm, password: e.target.value })}
          placeholder="Dejar vacío para mantener la actual"
        />
      </div>
      
      <div>
        <Label htmlFor="edit-parent">Líder Padre (opcional)</Label>
        <Select
          value={editLeaderForm.parentLeaderId}
          onValueChange={(value) => setEditLeaderForm({ ...editLeaderForm, parentLeaderId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar líder padre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Ninguno (Líder Principal)</SelectItem>
            {leaders
              .filter(l => l.id !== selectedLeaderForEdit?.id && !l.parentLeaderId)
              .map((leader) => (
                <SelectItem key={leader.id} value={leader.id}>
                  {leader.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="outline"
        onClick={() => setIsEditLeaderDialogOpen(false)}
        disabled={isSubmittingLeader}
      >
        Cancelar
      </Button>
      <Button
        onClick={submitEditLeader}
        disabled={isSubmittingLeader}
      >
        {isSubmittingLeader ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Diálogo de Confirmación de Eliminación (JSX)

```typescript
{/* Diálogo de Confirmación de Eliminación */}
<Dialog open={isDeleteLeaderDialogOpen} onOpenChange={setIsDeleteLeaderDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Eliminar Líder</DialogTitle>
      <DialogDescription>
        ¿Estás seguro de que deseas eliminar este líder?
      </DialogDescription>
    </DialogHeader>
    
    {selectedLeaderForDelete && (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">{selectedLeaderForDelete.name}</p>
          <p className="text-sm text-muted-foreground">CC: {selectedLeaderForDelete.document}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              • {selectedLeaderForDelete._count?.voters || 0} votantes
            </p>
            <p className="text-sm">
              • {selectedLeaderForDelete._count?.subLeaders || 0} sublíderes
            </p>
          </div>
        </div>
        
        {(selectedLeaderForDelete._count?.voters > 0 || selectedLeaderForDelete._count?.subLeaders > 0) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ No se puede eliminar este líder
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Primero debes eliminar o reasignar sus votantes y sublíderes.
            </p>
          </div>
        )}
      </div>
    )}
    
    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="outline"
        onClick={() => setIsDeleteLeaderDialogOpen(false)}
        disabled={isSubmittingLeader}
      >
        Cancelar
      </Button>
      <Button
        variant="destructive"
        onClick={confirmDeleteLeader}
        disabled={
          isSubmittingLeader ||
          (selectedLeaderForDelete?._count?.voters > 0) ||
          (selectedLeaderForDelete?._count?.subLeaders > 0)
        }
      >
        {isSubmittingLeader ? 'Eliminando...' : 'Eliminar'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Actualizar el Renderizado de LeaderTreeNode

```typescript
{organizeLeadersHierarchy().map((leader) => (
  <LeaderTreeNode 
    key={leader.id} 
    leader={leader} 
    level={0}
    expandedLeaderId={expandedLeaderId}
    toggleLeaderExpansion={toggleLeaderExpansion}
    leaderVoters={leaderVoters}
    onEditLeader={handleEditLeader}      // NUEVO
    onDeleteLeader={handleDeleteLeader}  // NUEVO
  />
))}
```

### Imports Adicionales Necesarios

```typescript
import { Pencil, Trash2 } from 'lucide-react'
```

## Características

### Edición de Líder
- ✅ Actualizar nombre
- ✅ Actualizar documento
- ✅ Cambiar contraseña (opcional)
- ✅ Cambiar jerarquía (convertir en sublíder o líder principal)
- ✅ Validación de duplicados de documento
- ✅ Actualización automática del índice de documentos

### Eliminación de Líder
- ✅ Validación de sublíderes
- ✅ Validación de votantes
- ✅ Confirmación antes de eliminar
- ✅ Mensajes de error descriptivos
- ✅ Eliminación automática del índice de documentos

### Seguridad
- ✅ Solo el candidato puede editar/eliminar líderes
- ✅ Validación de pertenencia del líder al candidato
- ✅ Validación de sesión
- ✅ Protección contra eliminación accidental

## Próximos Pasos

1. Aplicar los cambios al archivo `src/app/dashboard/candidate/page.tsx`
2. Probar la funcionalidad de edición
3. Probar la funcionalidad de eliminación
4. Verificar validaciones
5. Hacer deployment al servidor

---

**Fecha:** 18 de febrero de 2026  
**Estado:** Endpoint completado, pendiente integración en UI
