# Estado del proyecto

Auditoría de solo lectura del clon de X. El único archivo creado para esta auditoría es este documento. No se leyeron los valores de los archivos `.env`.

## 1. Estructura

### Aplicación web (raíz y `src/`)

| Ruta | Para qué sirve |
|---|---|
| `index.html` | Documento inicial de Vite. Define idioma, fuentes y el favicon `public/icon-x.png`. |
| `src/main.jsx` | Punto de entrada. Monta React, `BrowserRouter` y `AuthProvider`. |
| `src/App.jsx` | Define las rutas públicas y protegidas. `/` redirige a `/inicio`. |
| `src/index.css` | Estilos globales y configuración de Tailwind. |
| `src/assets/` | Recursos estáticos importables. `hero.png` no tiene referencias desde el código de `src/`. |
| `src/pages/` | Pantallas por ruta: `Login`, `Home`, `Profile`, `TweetDetail`, `SearchResults`, `Explore`, `Notifications`, `Following`, `Bookmarks`, `Chat`, `Premium` y `SectionPage`. |
| `src/components/` | Piezas reutilizables: `MainLayout`, `Sidebar`, `RightPanel`, `Feed`, `Tweet`, `TweetForm` y `Avatar`. |
| `src/context/AuthContext.jsx` | Mantiene el usuario autenticado, escucha cambios de Firebase Auth y expone registro, login y logout. |
| `src/context/auth-context.js` | Crea el contexto y el hook `useAuth`; no es otra implementación del provider. |
| `src/hooks/useUserProfile.js` | Suscribe el perfil propio por UID o busca un perfil por username. |
| `src/lib/userProfiles.js` | Normaliza usernames y crea/recupera perfiles y reservas de nombre con transacciones de Firestore. |
| `src/firebase/config.js` | Inicializa Firebase Auth, Google Provider y Firestore usando variables `VITE_*`. |
| `src/services/fakeTweets.js` | Convierte y pagina ejemplos JSON; guarda páginas en `sessionStorage`. |
| `src/data/` | Datos estáticos: publicaciones y usuarios ficticios, países, tendencias/noticias, notificaciones, sugerencias de cuentas y conversaciones. |
| `public/` | Archivos servidos directamente por Vite, incluido `icon-x.png`. |

La navegación global y los paneles laterales viven en `MainLayout.jsx`. `Home.jsx` muestra las pestañas del feed, el formulario y `Feed`. `Tweet.jsx` representa tanto publicaciones reales como ficticias. `Profile.jsx` consulta perfil y publicaciones. `Bookmarks.jsx` obtiene los marcadores del perfil.

### Backend (`server/`)

| Ruta | Estado |
|---|---|
| `server/prisma/schema.prisma` | Esquema Prisma 6 para PostgreSQL: User, Tweet, Like, Retweet, Bookmark y Follow. |
| `server/src/config/db.js` | Instancia singleton de `PrismaClient`. |
| `server/src/app.js` | Express con Helmet, CORS, JSON limitado a 1 MB, cookies, Morgan, health check y middlewares finales. |
| `server/src/server.js` | Carga `dotenv/config` y levanta Express en `PORT` o 3000. |
| `server/src/middlewares/errorHandler.js` | `AppError` y respuesta de errores centralizada en español. |
| `server/src/middlewares/notFound.js` | Convierte rutas desconocidas en error 404. |
| `server/src/controllers/`, `routes/`, `services/`, `validators/`, `utils/` | Directorios presentes, pero sin implementación de funcionalidades. |

El backend todavía no tiene rutas para usuarios o publicaciones, autenticación, migraciones aplicables ni conexión desde el frontend. Tener el esquema y crear el cliente Prisma no significa que Neon ya esté conectado o que haya tablas desplegadas.

## 2. Cómo funciona hoy

### Registro y acceso

1. `Login.jsx` muestra acceso con correo/contraseña, registro, Google y también teléfono/SMS.
2. `AuthContext.jsx` llama Firebase Auth: crea una cuenta con email/password, inicia sesión o usa `signInWithPopup` para Google. No hay autenticación propia en Express.
3. Después del acceso, `ensureUserProfile()` en `lib/userProfiles.js` usa una transacción de Firestore:
   - Lee `users/{uid}`.
   - Lee `usernameClaims/{username}` para comprobar/reservar el nombre.
   - Crea el perfil con `displayName`, `username`, `photoURL`, `bio`, `followers`, `following` y `createdAt`.
   - Añade un número al username si la reserva ya pertenece a otra persona.
4. Al registrarse por correo, el username elegido también se guarda como `displayName` de Firebase Auth. Con Google, el nombre visible proviene de `displayName` de Google.
5. El estado `profileError` del provider se establece si la transacción falla, pero las pantallas no muestran consistentemente ese error. Login sí convierte algunos errores de Firebase a mensajes en español.

### Posts, likes y feed

- `TweetForm.jsx` escribe el post en Firestore (`tweets`) con texto, UID y nombre del autor, fecha de servidor, arreglo `likes`, contador `replyCount` y `replyTo: null`.
- `Feed.jsx` escucha los posts reales. «Siguiendo» consulta publicaciones de los UID seguidos; «Para ti» consulta el feed general.
- `Tweet.jsx` agrega o quita el UID del arreglo `likes` mediante `arrayUnion` / `arrayRemove`. El like real, por lo tanto, sí persiste en Firestore.
- Las respuestas también se guardan en `tweets` con `replyTo` y actualizan el `replyCount` del post original mediante una transacción.
- `Profile.jsx` filtra posts propios, respuestas, publicaciones con datos multimedia o posts que tienen el UID del usuario en `likes`.
- `Bookmarks.jsx` lee los ID guardados en el perfil y busca los posts correspondientes.

### Datos ficticios y funciones locales

- `tweets.json` es contenido local de ejemplo. `fakeTweets.js` pagina las publicaciones de diez en diez y calcula valores de muestra para fecha, likes, vistas, respuestas y reposts.
- Los posts ficticios se muestran debajo de los posts reales en «Para ti». Sus likes, reposts y guardados solo cambian el estado React de esa instancia: no escriben en Firestore. Un guardado ficticio no aparece después en la lista real de Guardados.
- Los avatares de muestra usan URLs de `i.pravatar.cc`; las publicaciones son locales, pero esas imágenes requieren conexión a ese servidor externo.
- `explore.json` y `notifications.json` son datos estáticos. La búsqueda de texto recorre posts descargados de Firestore en el navegador; Firestore no está ofreciendo aquí un índice de búsqueda textual.
- `conversations.json` alimenta el chat local. Los mensajes y respuestas automáticas viven en memoria y se pierden al recargar.
- La pantalla `/seguir` usa sugerencias y seguimiento local, mientras que seguir desde perfiles y «A quién seguir» del panel derecho sí modifica documentos de Firestore. Esas dos experiencias no comparten el mismo estado.
- Premium es una pantalla demostrativa; no hay suscripción ni pago implementado.

## 3. Firestore: colecciones, campos y reglas

No se encontró `firestore.rules` ni `firebase.json` en la raíz. Esto significa que las reglas desplegadas en Firebase no se pueden verificar desde este código. No significa que la base remota carezca de reglas: pueden estar configuradas directamente en Firebase Console.

### Colecciones que usa el código

| Colección | Lecturas | Escrituras | Archivos principales |
|---|---|---|---|
| `users` | El documento propio por UID; perfiles por `username`; listas de hasta 100 usuarios y perfiles sugeridos. `Bookmarks.jsx` escucha la colección completa de `tweets`, no de `users`. | Alta/actualización del perfil; `displayName` y `bio`; arreglos `following` y `followers`; arreglo `bookmarks` con IDs de post. | `src/lib/userProfiles.js`, `src/hooks/useUserProfile.js`, `src/components/RightPanel.jsx`, `src/pages/Profile.jsx`, `src/components/Tweet.jsx` |
| `usernameClaims` | Lee documentos individuales de nombres existentes o candidatos dentro de transacciones. | Reserva `{ uid }`; borra la reserva antigua propia si se cambia/repara un username. | `src/lib/userProfiles.js` |
| `tweets` | Feed general ordenado por fecha; posts por `uid`; posts cuyo arreglo `likes` contiene un UID; post individual y respuestas por `replyTo`; colección completa en búsqueda, tendencias y Guardados. | Crea posts y respuestas; modifica `likes`; incrementa `replyCount`; elimina un post propio. | `src/components/Feed.jsx`, `src/components/TweetForm.jsx`, `src/components/Tweet.jsx`, `src/components/RightPanel.jsx`, `src/pages/TweetDetail.jsx`, `src/pages/SearchResults.jsx`, `src/pages/Bookmarks.jsx` |

**Campos de `users` que el frontend crea o modifica:**

- Creación de `ensureUserProfile`: `displayName`, `username`, `photoURL`, `bio`, `followers`, `following`, `createdAt`.
- Modificaciones posteriores: `displayName`, `bio`, `following`, `followers`, `bookmarks`.
- `email` no se copia actualmente al documento `users`; el email está en Firebase Auth.

**Campos de `usernameClaims`:** `uid`.

**Campos de `tweets`:**

- Creación: `text`, `uid`, `username`, `displayName`, `photoURL`, `createdAt`, `likes`, `replyCount`, `replyTo`.
- Respuestas usan los mismos campos, pero con `replyTo` igual al ID del post original. Las respuestas y el feed general se distinguen por `replyTo`.
- Cambios posteriores: `likes` y `replyCount`. Eliminación: documento completo, solo desde el menú del autor en la interfaz.

No hay colecciones Firestore `likes`, `follows`, `bookmarks`, `notifications` ni `messages` en uso por este frontend. Likes, relaciones, favoritos y respuestas se guardan como arreglos/campos en los documentos descritos; notificaciones y mensajes son datos locales. Las tablas con esos nombres en Prisma pertenecen a un backend separado y aún no son usadas por la web.

### Reglas de referencia para probar la aplicación actual

Estas reglas cubren las operaciones actuales y requieren usuario autenticado. **No las he desplegado ni guardado como archivo de reglas**. Antes de publicar, endurecer la exposición de las consultas que descargan colecciones enteras y probar todas las operaciones con Firebase Emulator. Los campos de seguidores son arreglos editados por clientes; para máxima integridad, mover el seguimiento y los contadores a un backend confiable.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function owns(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function followerChangeIsValid(uid) {
      let oldFollowers = resource.data.followers;
      let newFollowers = request.resource.data.followers;
      let myProfileAfter = getAfter(
        /databases/$(database)/documents/users/$(request.auth.uid)
      ).data;
      return oldFollowers is list
        && newFollowers is list
        && (
          (
            !oldFollowers.hasAny([request.auth.uid])
            && newFollowers.hasAny([request.auth.uid])
            && newFollowers.hasAll(oldFollowers)
            && newFollowers.size() == oldFollowers.size() + 1
            && myProfileAfter.following.hasAny([uid])
          )
          ||
          (
            oldFollowers.hasAny([request.auth.uid])
            && !newFollowers.hasAny([request.auth.uid])
            && oldFollowers.hasAll(newFollowers)
            && oldFollowers.size() == newFollowers.size() + 1
            && !myProfileAfter.following.hasAny([uid])
          )
        );
    }

    function likeChangeIsValid() {
      let oldLikes = resource.data.likes;
      let newLikes = request.resource.data.likes;
      return oldLikes is list
        && newLikes is list
        && (
          (
            !oldLikes.hasAny([request.auth.uid])
            && newLikes.hasAny([request.auth.uid])
            && newLikes.hasAll(oldLikes)
            && newLikes.size() == oldLikes.size() + 1
          )
          ||
          (
            oldLikes.hasAny([request.auth.uid])
            && !newLikes.hasAny([request.auth.uid])
            && oldLikes.hasAll(newLikes)
            && oldLikes.size() == newLikes.size() + 1
          )
        );
    }

    match /users/{uid} {
      // El frontend consulta perfiles para búsqueda, sugerencias y navegación.
      allow get, list: if signedIn();

      allow create: if owns(uid)
        && request.resource.data.keys().hasAll([
          'displayName', 'username', 'photoURL', 'bio',
          'followers', 'following', 'createdAt'
        ])
        && request.resource.data.keys().hasOnly([
          'displayName', 'username', 'photoURL', 'bio',
          'followers', 'following', 'createdAt', 'bookmarks'
        ])
        && request.resource.data.username is string
        && request.resource.data.username.matches('^[a-z0-9_]{1,20}$')
        && request.resource.data.displayName is string
        && request.resource.data.photoURL is string
        && request.resource.data.bio is string
        && request.resource.data.followers is list
        && request.resource.data.following is list
        && request.resource.data.createdAt == request.time
        && existsAfter(
          /databases/$(database)/documents/usernameClaims/$(request.resource.data.username)
        )
        && getAfter(
          /databases/$(database)/documents/usernameClaims/$(request.resource.data.username)
        ).data.uid == request.auth.uid;

      allow update: if signedIn() && (
        (
          owns(uid)
          && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['displayName', 'bio', 'bookmarks', 'following'])
        )
        ||
        (
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['followers'])
          && followerChangeIsValid(uid)
        )
      );

      allow delete: if false;
    }

    match /usernameClaims/{username} {
      allow get: if signedIn();
      allow list: if false;
      allow create, update: if signedIn()
        && request.resource.data.keys().hasOnly(['uid'])
        && request.resource.data.keys().hasAll(['uid'])
        && request.resource.data.uid == request.auth.uid
        && (!exists(
          /databases/$(database)/documents/usernameClaims/$(username)
        ) || resource.data.uid == request.auth.uid);
      allow delete: if signedIn() && resource.data.uid == request.auth.uid;
    }

    match /tweets/{tweetId} {
      allow get, list: if signedIn();

      allow create: if signedIn()
        && request.resource.data.keys().hasAll([
          'text', 'uid', 'username', 'displayName', 'photoURL',
          'createdAt', 'likes', 'replyCount', 'replyTo'
        ])
        && request.resource.data.keys().hasOnly([
          'text', 'uid', 'username', 'displayName', 'photoURL',
          'createdAt', 'likes', 'replyCount', 'replyTo'
        ])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 280
        && request.resource.data.username is string
        && request.resource.data.displayName is string
        && request.resource.data.photoURL is string
        && request.resource.data.createdAt == request.time
        && request.resource.data.likes is list
        && request.resource.data.likes.size() == 0
        && request.resource.data.replyCount == 0
        && (
          request.resource.data.replyTo == null
          || request.resource.data.replyTo is string
          && exists(
            /databases/$(database)/documents/tweets/$(request.resource.data.replyTo)
          )
        );

      allow update: if signedIn() && (
        (
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['likes'])
          && likeChangeIsValid()
        )
        ||
        (
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['replyCount'])
          && request.resource.data.replyCount == resource.data.replyCount + 1
        )
      );

      allow delete: if signedIn() && resource.data.uid == request.auth.uid;
    }
  }
}
```

Estas reglas siguen el modelo de datos actual, pero no resuelven todos sus límites: un usuario puede editar su propio arreglo `following`, y el `replyCount` se incrementa desde el cliente. Para producción, validar esos cambios mediante un backend confiable o rediseñar las relaciones como documentos separados con reglas estrictas. Además, las consultas de búsqueda, tendencias y Guardados descargan más posts de los que cada pantalla necesita.

### Por qué aparece `403 permission-denied`

El primer acceso con una cuenta nueva no termina en Firebase Auth solamente: acto seguido se ejecuta una transacción que debe leer y crear documentos en `users` y `usernameClaims`. Si las reglas remotas no permiten esas operaciones, Firestore responde `permission-denied`. Después Home y el panel derecho también leen `users` y `tweets`, así que unas reglas solo de escritura tampoco bastan.

El código de frontend por sí solo no permite asegurar qué operación concreta produjo el 403. Para identificarla, revisar Firebase Console → Firestore → Rules y el error completo de consola del navegador; comprobar que el Firebase Project ID de `VITE_PROJECT_ID` sea el proyecto al que se desplegaron las reglas. La autenticación exitosa no concede permisos de Firestore automáticamente.

## 4. Qué está bien

- El frontend separa rutas, componentes, autenticación y perfil; Firebase Auth es la fuente de identidad actual.
- Los posts reales, likes, respuestas, seguimientos desde perfil/panel derecho y guardados reales están conectados a Firestore.
- Se usan `serverTimestamp`, `arrayUnion`, `arrayRemove` y una transacción para responder e incrementar el contador.
- El username se normaliza y las reservas se coordinan con transacciones para reducir colisiones.
- El feed distingue los datos reales de los de ejemplo y no escribe reacciones ficticias en Firestore.
- El backend tiene middleware de errores, 404, medidas básicas de Express y un esquema relacional válido para iniciar el diseño de PostgreSQL.
- `.gitignore` incluye `.env`. Los archivos `.env` no se inspeccionaron, por lo que aquí no se copian valores secretos.
- `VITE_*` queda accesible al navegador por diseño. La API key de Firebase no reemplaza las reglas; hay que limitar su uso en Google Cloud y proteger Firestore con reglas.

## 5. Qué está mal, roto o inconsistente

1. **Permisos de Firestore:** es la explicación más probable de los 403 dados. No hay reglas ni configuración de Firebase versionadas aquí, y el login intenta crear/leer el perfil inmediatamente.
2. **Errores de perfil poco visibles:** `AuthContext` conserva `profileError`, pero las pantallas no lo consumen. Un fallo al crear el perfil puede parecer un problema de login o dejar al usuario autenticado sin perfil.
3. **Datos demasiado abiertos para el diseño actual:** búsqueda y tendencias leen todos los tweets; el panel derecho enumera perfiles; Guardados escucha todos los tweets y filtra en cliente. Aunque se permita solo a usuarios autenticados, es acceso amplio y costoso.
4. **Seguimiento inconsistente:** `/seguir` alterna estado local con JSON; no modifica `users.following` ni `users.followers`. El perfil y el panel derecho sí escriben esos arreglos a Firestore.
5. **Chat y notificaciones son demostraciones:** ni mensajes ni notificaciones se guardan en Firestore. Chat pierde los mensajes al recargar.
6. **Guardados mixtos:** los posts reales usan `users/{uid}.bookmarks`; los ficticios solo se guardan temporalmente en el componente y no aparecen en `/guardados`.
7. **Campos frontend/backend no coinciden:** Firestore usa `tweets.uid`, `replyTo`, `photoURL`, `likes` como lista y contadores embebidos. Prisma usa `authorId`, `replyToId`, `avatarUrl`, modelos separados `Like`, `Retweet`, `Bookmark` y `Follow`. Migrar requiere conversión, no solo cambiar la URL de conexión.
8. **Campos y autenticación diferentes:** Firestore no guarda `email` en `users`; Prisma lo exige y usa `passwordHash` opcional. Firebase Auth lleva credenciales, mientras que el backend todavía no valida tokens Firebase ni implementa sesiones.
9. **Prisma no está integrado:** el cliente no se importa en ninguna ruta, no hay endpoints funcionales ni migraciones aplicadas, y el frontend no llama a `server/`.
10. **Archivos y pruebas:** no hay reglas de Firestore ni `firebase.json`; el `README.md` es el texto inicial de plantilla; el script `test` de `server/package.json` es un placeholder que termina con error. La raíz no declara script `test`.
11. **Funciones de UI que no publican contenido:** los iconos de imagen, GIF y ubicación del formulario son visuales; no hay subida de multimedia en la lógica actual.
12. **Recursos externos:** los avatares ficticios provienen de `i.pravatar.cc` y la fuente Inter se carga desde Google Fonts; no todo el contenido visual es local.
13. **Secretos:** el código leído no contiene credenciales de Neon; no se inspeccionó ningún `.env`. El `.gitignore` excluye `.env`, pero sin verificar el historial Git no se puede afirmar que nunca se haya subido. Si una credencial real llegó a un repositorio remoto, hay que rotarla. No usar prefijo `VITE_` para contraseñas o claves privadas.

## 6. Qué se podría eliminar (no se eliminó nada)

| Ruta | Motivo y condición |
|---|---|
| `src/components/Navbar.jsx` | Está vacío (0 bytes) y no hay importaciones desde `src/`. Se puede eliminar después de confirmar que ningún script externo lo referencia. |
| `src/assets/hero.png` | No hay referencias en el código de `src/`. Se puede eliminar si no se reserva para contenido futuro. |
| Dependencias `@types/react` y `@types/react-dom` de `package.json` raíz | El código fuente encontrado es JavaScript/JSX, sin TypeScript. Se pueden quitar si no hay herramientas externas que compilen tipos. |
| Dependencias `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, `zod` de `server/package.json` | No están importadas por el backend actual. Parecen preparadas para autenticación/validación futuras; quitarlas solo si no se van a usar en el siguiente paso. |

No eliminar `src/context/auth-context.js`: lo usa `AuthContext.jsx` y lo importan otras pantallas. Tampoco eliminar `SectionPage.jsx`: sirve a Listas, Comunidades, Creator Studio, Configuración y Centro de ayuda. `countries.js` se usa en Login y `fakeTweets.js` en feed, tendencias y búsqueda.

La dependencia `prisma` está en `dependencies` del servidor aunque hoy se usa como herramienta de esquema/generación. Normalmente puede moverse a `devDependencies`; no es una dependencia sobrante mientras se ejecuten comandos Prisma.

## 7. Estado de `server/`

- **Existe:** Express 5, middleware Helmet/CORS/cookies/Morgan, límite JSON, endpoint `/api/health`, 404 y error handler; configuración `dotenv`; singleton Prisma Client; esquema PostgreSQL Prisma 6.
- **Modelos:** `User` (id, email, passwordHash, username, displayName, bio, avatarUrl, bannerUrl, location, website, createdAt); `Tweet` (id, text, authorId, replyToId, quoteOfId, createdAt); relaciones `Like`, `Retweet`, `Bookmark`, `Follow`.
- **Falta:** registro/login, validación de token Firebase, autorización, controladores, rutas REST, validadores, servicios, integración con el frontend, conexión comprobada con Neon, migraciones aplicadas, pruebas y cierre ordenado del cliente Prisma.
- **No conectado:** iniciar sesión y publicar hoy utilizan Firebase. `server/` no interviene en esas operaciones.
- `bcryptjs`, `jsonwebtoken`, `express-rate-limit` y `zod` están instalados, pero aún no usados. No implementar auth local con contraseña si el camino elegido es conservar Firebase Auth.

## 8. Plan recomendado

### A) Quedarse con Firebase (recomendado para desbloquear el estado actual)

1. Confirmar en Firebase Console el proyecto activo y las reglas desplegadas; no publicar todavía reglas abiertas a toda persona no autenticada.
2. Crear y versionar `firestore.rules` y `firebase.json`. Empezar con reglas de solo usuario autenticado y propiedad propia, permitir solo las operaciones necesarias y probarlas en Firebase Emulator.
3. Verificar el alta nueva: Auth crea la cuenta; la transacción crea `users/{uid}` y `usernameClaims/{username}`. Revisar la consola del navegador si alguna lectura/escritura da 403.
4. Verificar Google y email/password, después feed, likes, respuesta, follow, edición de perfil y guardado, operación por operación.
5. Mostrar `profileError` y errores de carga en todas las pantallas, no solo en Login/Home.
6. Unificar `/seguir` con Firestore o etiquetarlo claramente como demo local.
7. Mejorar consultas: filtrar Guardados en consulta por IDs en lotes permitidos, limitar feed/búsqueda y restringir lecturas de perfiles; mover tendencias y respuestas seguras a un backend cuando sea necesario.
8. Mantener `server/` aparcado o retirarlo del despliegue web hasta que haya una necesidad concreta. No mantener dos fuentes de verdad para el mismo perfil/post.

**Ventajas:** menos trabajo, Auth y datos ya conectados, no hay migración de cuentas/passwords.  
**Costo:** reglas Firestore deben estar bien diseñadas; búsqueda y consultas grandes necesitan otro diseño para escalar.

### B) Migrar datos a Neon y conservar Firebase Auth para Google

1. Definir primero el contrato definitivo de API y mapear los campos Firestore → Prisma: `uid` a `authorId`, `replyTo` a `replyToId`, `photoURL` a `avatarUrl`, arreglos de likes/follows/bookmarks a tablas relacionales.
2. Definir cómo se identifica al usuario por Firebase UID. Recomiendo agregar un campo Firebase UID único al `User` SQL; no asumir que `cuid` equivale al UID Firebase.
3. Decidir cómo conservar acceso por correo: si Firebase Auth se conserva, no almacenar/verificar passwords en Prisma; verificar ID tokens Firebase en Express. El campo `passwordHash` probablemente no se necesita.
4. Crear y aplicar migraciones de Prisma en Neon; configurar `.env` únicamente para servidor, conservarlo ignorado y no exponer `DATABASE_URL` al frontend.
5. Implementar middleware que valide Firebase ID tokens, endpoints y autorización antes de migrar datos reales.
6. Cambiar una función a la vez (por ejemplo crear/listar tweets), con pruebas y manejo de errores; no permitir que frontend escriba a Firestore y PostgreSQL en paralelo sin estrategia de sincronización.
7. Migrar datos con respaldo, conteos y verificación. Ejecutar ambos sistemas en pruebas, cambiar el frontend al API y luego revocar escrituras Firestore.
8. Limitar reglas Firestore durante transición y retirar Firestore solo cuando Auth/perfiles/datos que aún se necesiten estén migrados.

**Ventajas:** control relacional y consultas más flexibles en SQL.  
**Costo/riesgo:** requiere API segura, verificación de tokens, migración de datos, despliegue y nueva estrategia de búsqueda; no arregla por sí solo los 403 actuales de Firestore.

## Resumen en 10 líneas

1. La web usa Firebase Auth y Firestore; el backend Express/Prisma no está conectado.
2. Email/password, Google y teléfono autentican con Firebase Auth.
3. Cada acceso intenta leer/escribir `users` y `usernameClaims`; reglas insuficientes explican probablemente los 403.
4. Los posts reales, likes, respuestas, perfiles y algunos follows/guardados se guardan en Firestore.
5. Los posts de `fakeTweets` vienen de JSON local; sus interacciones no persisten.
6. Chat, notificaciones, Premium y la página `/seguir` son principalmente demostraciones locales.
7. No hay reglas Firestore ni `firebase.json` en el proyecto para revisar o desplegar.
8. El esquema Prisma usa nombres y relaciones distintos; hace falta mapear antes de migrar.
9. El camino más rápido y seguro ahora es diagnosticar reglas y permisos en Firebase Emulator/Console.
10. No se borró ni editó código; solo se creó este informe.
