# 🎰 Ruleta Simulacro Multipeligro - COER Moquegua

Ruleta interactiva para sorteos y simulacros.

## 🚀 Publicar en GitHub Pages

### Paso 1: Subir archivos a GitHub

1. Ve a tu repositorio: https://github.com/tachuelota/ruleta
2. Asegúrate de tener esta estructura de archivos:

```
ruleta/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── storage.js
├── assets/
│   └── logo.png (opcional)
└── README.md
```

### Paso 2: Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, busca **Pages**
4. En **Source**, selecciona la rama `main` (o `master`)
5. Selecciona la carpeta `/ (root)`
6. Click en **Save**

### Paso 3: Esperar y acceder

Después de 1-3 minutos, tu ruleta estará disponible en:

```
https://tachuelota.github.io/ruleta/
```

## 📱 Características

- ✅ **Funciona 100% en el navegador** (sin servidor necesario)
- ✅ **Responsive** - funciona en móviles, tablets y PC
- ✅ **Offline** - usa IndexedDB para guardar datos localmente
- ✅ **Personalizable** - colores, imágenes y premios
- ✅ **Registro de ganadores** - exportable a CSV

## 🎨 Uso

1. **Configurar**: Click en ⚙️ para agregar premios con imágenes
2. **Girar**: Click en "Girar" o arrastra la ruleta
3. **Ver resultado**: Se muestra automáticamente al detenerse
4. **Registrar ganador**: Ingresa el nombre de la persona
5. **Exportar**: Descarga la lista de ganadores en CSV

## 🔧 Personalización

### Cambiar colores
- En Configuración → 🎨 Color de fondo
- Selecciona el color que prefieras
- Se guarda automáticamente

### Agregar tu logo
Coloca tu logo en `assets/logo.png` (recomendado: 512x512px)

### Gestionar ganadores
- **Ver ganadores**: Lista completa con fechas
- **Exportar CSV**: Descarga para Excel
- **Limpiar lista**: Reinicia desde cero

## 💾 Almacenamiento

Todos los datos se guardan en:
- **IndexedDB**: Imágenes y configuración de premios
- **localStorage**: Lista de ganadores y preferencias

Los datos persisten incluso si cierras el navegador.

## 📞 Soporte

Para dudas o problemas, abre un Issue en GitHub.

## 📄 Licencia

Libre para uso educativo y gubernamental.