# CALYX — Documento Maestro del Proyecto

**Estado actual:** seguridad consolidada en `main`; frontend y backend siguen en evolución.  
**Stack principal:** React/Vite + React Native/Expo + FastAPI + PostgreSQL + AWS EC2.

---

## 1. Objetivo

CALYX es una plataforma de gestión e inspección agrícola para florícolas e invernaderos de rosas.

Busca centralizar:

- florícolas;
- usuarios y roles;
- galpones/invernaderos;
- camas de cultivo;
- cosecha, poda y riego;
- censos;
- análisis de video con IA;
- métricas y proyecciones;
- administración global desde SuperAdmin;
- operación móvil en campo.

El sistema está pensado como **multi-tenant**: varias florícolas usan la misma plataforma sin mezclar sus datos.

---

## 2. Arquitectura

### Frontend web
```text
React
Vite
JavaScript / JSX
CSS
```

Carpeta:
```text
frontend-web/
```

Comandos:
```bash
npm install
npm run dev
npm run build
```

### App móvil
```text
React Native / Expo
```

Uso principal:
- login de operarios;
- consulta de camas asignadas;
- registros de campo;
- grabación/subida de video;
- sincronización con backend.

### Backend
```text
FastAPI
Python
SQLAlchemy
JWT
bcrypt
SlowAPI
```

Módulos relevantes:
```text
backend/app/api/routes/auth.py
backend/app/api/routes/finca.py
backend/app/api/routes/personal.py
backend/app/api/routes/configuracion.py
backend/app/api/routes/dashboard.py
backend/app/api/routes/vision.py
backend/app/api/routes/censo.py

backend/app/core/security.py
backend/app/core/dependencies.py
backend/app/core/rate_limit.py
backend/app/core/database.py
backend/app/models/models_db.py
```

### Base de datos
```text
PostgreSQL
```

Entidades principales:
```text
Finca
Usuario
Galpon
Cama
Seccion
Carga
MetricasIA
RegistroRiego
RegistroCosecha
RegistroPoda
TipoFlor
EstadoFenologico
TokenAcceso
```

### Infraestructura
```text
AWS EC2
t3.medium
region us-east-2
```

Flujo general:
```text
Internet
   ↓
Nginx
   ↓
Frontend web
   ↓
FastAPI
   ↓
PostgreSQL
```

---

## 3. Roles

```text
SuperAdmin
Administrador
Supervisor
Operario
```

- `SuperAdmin`: administración global.
- `Administrador`: administra una florícola.
- `Supervisor`: gestión y consulta gerencial/operativa.
- `Operario`: trabajo de campo sobre recursos asignados.

---

## 4. Seguridad implementada

La rama:

```text
seguridad-jwt-rbac
```

fue completada, probada y fusionada a:

```text
main
```

### JWT + RBAC centralizado

Archivo:
```text
backend/app/core/dependencies.py
```

Funciones principales:
```python
obtener_usuario_actual()
requerir_roles(...)
```

Flujo:
```text
Bearer JWT
   ↓
firma válida
   ↓
token vigente
   ↓
no revocado
   ↓
usuario existe
   ↓
usuario activo
   ↓
rol permitido
   ↓
endpoint
```

---

## 5. Sesiones JWT

Duración normal:
```text
15 minutos
```

Payload de sesión:
```json
{
  "sub": "usuario-id",
  "email": "correo",
  "rol": "Supervisor",
  "tipo": "sesion",
  "sesion_inicio": 1234567890
}
```

### Sliding expiration
El backend puede emitir:
```text
X-Refresh-Token
```

Solo cuando:
```text
JWT válido
token no revocado
usuario activo
respuesta exitosa
```

No se renueva en:
```text
401
403
usuario inactivo
token revocado
```

### Límite absoluto
```text
8 horas
```

Después de 8 horas:
```text
401 Unauthorized
```

aunque el usuario siga activo.

---

## 6. Magic Link

Ahora es de un solo uso.

Flujo:
```text
Magic Link
   ↓
hash guardado
   ↓
usado = False
   ↓
login correcto
   ↓
usado = True
```

Pruebas:
```text
primer uso  → 200
segundo uso → 400
```

Usuario inactivo:
```text
Magic Link válido + usuario Inactivo → 403
```

---

## 7. Logout real

El logout invalida el JWT en backend.

```text
JWT
 ↓
POST /auth/logout
 ↓
SHA-256(token)
 ↓
TokenAcceso
tipo = Revocado
usado = True
```

Después:
```text
mismo JWT → 401
```

Código relevante:
```python
token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
```

---

## 8. Rate limiting

Dependencia:
```text
slowapi==0.1.10
```

Archivo:
```text
backend/app/core/rate_limit.py
```

Límites:
```text
/auth/verificar-correo
→ 5/min/IP

/auth/login-operario
→ 5/min/IP

/auth/login-magic-link
→ 10/min/IP
```

Pruebas:
```text
verificar-correo → intento 6 = 429
login-operario   → intento 6 = 429
login-magic-link → intento 11 = 429
```

---

## 9. Multi-tenant

Se reforzó el aislamiento usando:

```text
finca_id
empresa_id
```

en recursos como:
```text
usuarios
galpones
camas
cargas
metricas
censo
poda
personal
configuracion
```

Ejemplo:
```python
cama = db.query(models_db.Cama).filter(
    models_db.Cama.id == cama_id,
    models_db.Cama.finca_id == finca.id
).first()
```

Objetivo:
```text
FINCA A
  ✕ no consulta
  ✕ no modifica
  ✕ no asigna
recursos de FINCA B
```

---

## 10. Módulos protegidos

Se aplicó RBAC a:
```text
Dashboard
Configuracion
Personal
Finca
Censo
Vision
SuperAdmin
```

Visión gerencial:
```text
Permitidos:
- SuperAdmin
- Administrador
- Supervisor

Bloqueado:
- Operario
```

---

## 11. SuperAdmin

La consola global muestra florícolas con:
```text
Nombre
RUC
Provincia
Plan
Estado de pago
Fecha de registro
Invernaderos
Camas
Variedades activas
```

También existe detalle por florícola.

---

## 12. Cambio más reciente: crear administradores desde SuperAdmin

Se decidió no usar un botón global ambiguo de “Crear administrador”.

La ubicación elegida es:
```text
SuperAdmin
  ↓
Florícola
  ↓
Ver detalle
  ↓
Administradores asignados
  ↓
+ Nuevo administrador
```

### Formulario
```text
REGISTRAR ADMINISTRADOR · HACIENDA X

Cargo
Nombre
Apellido
Cedula

Telefono
Correo electronico
PIN

Direccion

[CANCELAR] [REGISTRAR ADMINISTRADOR]
```

### Decisión de backend

Ruta específica:
```text
POST /api/superadmin/fincas/{finca_id}/administradores
```

La creación debe guardar:
```text
rol = Administrador
finca_id = finca seleccionada
empresa_id = finca seleccionada
```

Esto evita crear un administrador accidentalmente en la florícola equivocada.

---

## 13. Código generado recientemente

Se generó:
```text
calyx_admin_superadmin_modificado.zip
```

Incluye cambios de frontend y backend.

El frontend compiló correctamente con:
```bash
npm run build
```

Resultado:
```text
✓ build completado
```

La advertencia de Vite por chunks grandes no impidió la compilación.

---

## 14. Decisiones técnicas tomadas

### Stack
Se mantiene:
```text
React/Vite
React Native/Expo
FastAPI
PostgreSQL
AWS EC2
```

### Seguridad
- JWT corto: 15 min.
- Sliding expiration.
- Sesión máxima: 8 h.
- Magic Link de un solo uso.
- Usuario inactivo bloqueado.
- Logout con revocación real.
- Rate limiting en endpoints sensibles.

### Multi-tenant
El backend siempre valida la finca/empresa del recurso.

### SuperAdmin
No debe depender del mismo flujo de finca que un Administrador normal.

### Git
Flujo recomendado:
```text
main
 ↓
feature/*
fix/*
security/*
 ↓
Pull Request
 ↓
main
```

La rama de seguridad ya fue mergeada correctamente.

---

## 15. Estado actual de `main`

Se verificó:
```bash
python -m py_compile app/main.py
python -m py_compile app/core/security.py
python -m py_compile app/core/dependencies.py
python -m py_compile app/core/rate_limit.py
python -c "from app.main import app; print('MAIN OK')"
```

Resultado:
```text
MAIN OK
```

---

## 16. Problema / tarea actual pendiente

El punto inmediato pendiente es:

> **terminar de validar en local el flujo de creación de Administradores desde SuperAdmin, conectando correctamente frontend + backend + base de datos.**

El frontend ya:
```text
✓ instala dependencias
✓ compila
✓ genera dist
```

Falta validar este flujo completo:
```text
SuperAdmin
  ↓
Ver detalle de una florícola
  ↓
Nuevo administrador
  ↓
Formulario
  ↓
POST al backend
  ↓
usuario creado
  ↓
asignado a la finca correcta
  ↓
visible en Administradores asignados
```

Y comprobar:
```text
frontend localhost
      ↓
backend local o remoto
      ↓
CORS correcto
      ↓
endpoint responde
      ↓
nuevo administrador queda en PostgreSQL
```

Ese es el problema funcional más inmediato por resolver ahora.

---

## 17. Pendientes posteriores

```text
[ ] Nginx
[ ] HTTPS / TLS
[ ] headers de seguridad
[ ] CORS definitivo
[ ] auditoría de eventos
[ ] limpieza automática de tokens expirados
[ ] pytest
[ ] batería multiempresa A vs B
[ ] revisar integración frontend + app móvil
[ ] continuar módulos funcionales
```

---

## 18. Arquitectura resumida

```text
                    ┌───────────────────┐
                    │    SUPERADMIN     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   FRONTEND WEB    │
                    │   React + Vite    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      FASTAPI      │
                    ├───────────────────┤
                    │ JWT               │
                    │ RBAC              │
                    │ Multi-tenant      │
                    │ Rate limiting     │
                    │ Session control   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │    PostgreSQL     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   IA / METRICAS   │
                    │ Video / Censos    │
                    └───────────────────┘

APP MOVIL ───────────────► FASTAPI
```

---

## 19. Resumen ejecutivo

CALYX ya cuenta con:

```text
✓ backend FastAPI
✓ PostgreSQL
✓ frontend web
✓ app móvil
✓ multi-tenant
✓ JWT
✓ RBAC
✓ Magic Link
✓ logout real
✓ sesiones controladas
✓ rate limiting
✓ SuperAdmin
✓ módulos agrícolas
✓ carga y análisis de video
✓ despliegue en AWS
```

La fase de seguridad principal está consolidada en `main`.

El desarrollo actual vuelve a concentrarse en producto, comenzando por completar:

```text
SuperAdmin → Florícola → Nuevo administrador
```

y validar correctamente la integración entre frontend, backend y base de datos.
