# Webhook `claudia-generar`

`POST https://carlosarenal.app.n8n.cloud/webhook/claudia-generar`

Es el único punto por el que la app produce contenido. El workflow tiene tres
responsabilidades, en este orden:

1. Generar la imagen a partir del prompt y del contexto de marca.
2. Subirla al bucket `piezas` de Supabase Storage.
3. Escribir (o actualizar) la fila en la tabla `piezas`.

La app **no** inserta la fila: en cuanto el webhook responde, vuelve a leer
`piezas` de Supabase y muestra lo que encuentre. Supabase es la fuente de verdad.

## Qué cambia respecto a la versión actual

Hoy el webhook acepta `{prompt, centro}`. Debe pasar a aceptar la pieza completa
con sus identificadores, para poder rellenar todas las columnas y aplicar el
contexto de marca al prompt.

## Cuerpo de la petición

```jsonc
{
  // null = crear una pieza nueva. Con valor = regenerar esa pieza y actualizar su fila.
  "pieza_id": null,

  // Se corresponde 1:1 con las columnas de la tabla `piezas`.
  "pieza": {
    "titulo": "Publicación de julio para Instagram",
    "centro_id": 12,
    "carpeta_id": 103,          // puede ser null
    "situacion_id": 1,          // puede ser null
    "linea_id": 2,              // puede ser null
    "estado": "borrador",
    "fecha_publicacion": "2026-08-05",   // ISO o null
    "canal": "Instagram",
    "consentimiento_ok": true,
    "notas_compliance": "Situación: Testimonio de paciente. Consentimiento firmado confirmado. …",
    "prompt": "Instrucción concreta para el modelo de imagen.",

    // Va tal cual a la columna jsonb `brief`.
    "brief": {
      "texto": "El encargo escrito por el equipo.",
      "objetivo": "Orgánico",            // Orgánico | Promoción
      "ratio": "4:5",                    // 1:1 | 4:5 | 9:16 | 16:9
      "formato": "Imagen",               // Imagen | Animación
      "variantes": 4,                    // cuántas imágenes debe producir el workflow
      "direccion": { "estilo": "Editorial", "iluminacion": "Natural", "encuadre": "Medio" },
      "material": { "url": "https://…/piezas/material/1784…-foto.jpg", "nombre": "foto.jpg" },
      "situacion": {
        "exposicion": "Anónimo (sin rostro)",
        "personas": null,
        "menores": false,
        "entorno": null,
        "validadoPorProfesional": false,
        "fondoLibre": false,
        "sinPacientes": false
      }
    }
  },

  // Contexto para construir el prompt final. No se guarda en la tabla.
  "contexto": {
    "centro": {
      "id": 12,
      "nombre": "Hospital Universitario del Vinalopó",
      "ciudad": "Elche",
      "tipo": "Hospital",
      "hub": { "id": 2, "clave": "levante", "nombre": "Hub Levante" }
    },
    "linea": { "id": 2, "clave": "prevencion", "nombre": "Prevención y promoción de la salud", "descripcion": "…" },
    "situacion": { "id": 1, "clave": "testimonio", "nombre": "Testimonio de paciente", "requiere_consentimiento": true },
    "marca": {
      "territorio": "Salud Responsable",
      "tipografia": "Mulish",
      "paleta": [{ "hex": "#D71029", "nombre": "Rojo" }, "…"],
      "reglas": ["Nunca prometer resultados clínicos…", "…"]
    }
  }
}
```

## Respuesta esperada

```json
{ "ok": true, "pieza_id": "8c1f…-uuid", "imagen_url": "https://…/piezas/8c1f….jpg" }
```

- `pieza_id` es opcional pero recomendable: si viene, la app muestra exactamente
  esa pieza. Si no viene, toma las piezas del centro creadas después de lanzar la
  petición.
- Si el workflow devuelve un array, la app usa el primer elemento.
- Para señalar un fallo: `{ "ok": false, "error": "mensaje legible en español" }`.
  Ese texto se muestra tal cual en el estudio.
- Si `brief.variantes` > 1 y el workflow crea varias filas, la app las muestra
  todas como variantes (V1, V2…). Con una sola fila, muestra una.

## Notas de implementación

- **Timeout**: la app espera hasta 120 s. Conviene responder dentro de ese margen;
  si el proceso es más largo, responder pronto con `pieza_id` y dejar que la app
  recargue después.
- **Credenciales**: la `service_role` key de Supabase y la clave del modelo de
  imagen viven solo en las credenciales de n8n. El frontend nunca las ve.
- **CORS**: el nodo Webhook debe permitir el origen del sitio publicado en
  Cloudflare (`Allowed Origins` en la configuración del nodo, o un
  `Access-Control-Allow-Origin` en la respuesta). Sin esto el navegador bloquea
  la llamada aunque el workflow funcione.
- **Método OPTIONS**: el navegador enviará un preflight porque la petición lleva
  `Content-Type: application/json`. El webhook debe responderlo.
- **Marca en el prompt**: `contexto.marca` trae la paleta, la tipografía, el
  territorio y las reglas de cumplimiento vigentes. Conviene incorporarlas al
  prompt final para que la imagen nazca on-brand, y respetar `notas_compliance`
  como restricción (sin pacientes identificables, sin promesas clínicas, etc.).
