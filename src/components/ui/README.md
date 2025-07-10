# 🎨 UI Components - Biblioteca de Componentes Base

## 🎯 Propósito

Esta carpeta contiene componentes UI reutilizables basados en **shadcn/ui**. Son los bloques de construcción fundamentales que se usan en todas las features.

## 📚 Componentes Disponibles

### Componentes de Layout
- **Card** - Contenedor con bordes y sombras
- **Separator** - Línea divisoria visual
- **ScrollArea** - Área con scroll personalizado
- **Sheet** - Panel deslizable (drawer)

### Componentes de Formulario
- **Button** - Botones con variantes
- **Input** - Campo de entrada de texto
- **Label** - Etiquetas para formularios
- **Form** - Componentes de react-hook-form

### Componentes de Feedback
- **Badge** - Etiquetas informativas
- **Progress** - Barra de progreso
- **Sonner** - Sistema de toasts/notificaciones

### Componentes de Navegación
- **Tabs** - Navegación por pestañas
- **Dialog** - Modales/diálogos

### Componentes de Datos
- **Avatar** - Imagen de perfil/placeholder

## 🎨 Sistema de Diseño

### Variantes de Botón
```typescript
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
size: "default" | "sm" | "lg" | "icon"
```

### Variantes de Badge
```typescript
variant: "default" | "secondary" | "destructive" | "outline"
```

## 💡 Mejores Prácticas

### 1. **Composición sobre Configuración**
```typescript
// ✅ Bien - Componer componentes
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// ❌ Mal - Mega componente con props
<MegaCard title="..." content="..." footer="..." />
```

### 2. **Accesibilidad Integrada**
Todos los componentes incluyen:
- Atributos ARIA apropiados
- Navegación por teclado
- Roles semánticos
- Labels descriptivos

### 3. **Tailwind + CSS Variables**
```css
/* Los componentes usan variables CSS para temas */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
```

## 🔧 Cómo Usar

### 1. **Importación**
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
```

### 2. **Extensión con cn()**
```typescript
import { cn } from "@/lib/utils"

<Button 
  className={cn(
    "custom-class",
    isActive && "active-class"
  )}
/>
```

### 3. **Variantes Personalizadas**
```typescript
// Crear variante específica del proyecto
export const PrimaryButton = ({ children, ...props }) => (
  <Button variant="default" size="lg" {...props}>
    {children}
  </Button>
)
```

## 📖 Recursos

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

💡 **Nota del Mentor**: Estos componentes son la base. Úsalos como están para consistencia, o envuélvelos en componentes de dominio específico cuando necesites lógica adicional. La clave es mantener la UI consistente en toda la aplicación.