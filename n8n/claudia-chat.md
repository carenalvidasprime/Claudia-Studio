# Webhook `claudia-chat` (copiloto)

`POST https://carlosarenal.app.n8n.cloud/webhook/claudia-chat`

Este webhook **todavía no existe**: hay que crearlo. Mientras tanto, el copiloto
de la app avisa de que no está disponible en vez de fallar.

Su razón de ser es que la clave del modelo de lenguaje no puede estar en el
frontend. n8n la guarda y la app solo envía la conversación.

## Cuerpo de la petición

```jsonc
{
  "mensajes": [
    { "role": "user", "content": "Ideas de copy para un testimonio de paciente" },
    { "role": "assistant", "content": "…" },
    { "role": "user", "content": "Y para LinkedIn?" }
  ],
  "contexto": {
    "territorio": "Salud Responsable",
    "centro": { "nombre": "Ribera Povisa", "ciudad": "Vigo", "tipo": "Hospital" },
    "lineas": ["Atención y experiencia del paciente", "…"],
    "reglas": ["Nunca prometer resultados clínicos…", "…"],
    "encargo": "El texto del encargo en curso, si lo hay."
  }
}
```

## Respuesta esperada

```json
{ "respuesta": "Texto en español, en prosa corriente." }
```

También se aceptan las claves `output` o `text`, por comodidad con los nodos de
IA de n8n que las usan por defecto.

## Prompt de sistema sugerido

El mismo criterio que se validó en el prototipo:

> Eres Claudia, la IA copiloto de comunicación en redes sociales del Grupo Ribera
> (grupo hospitalario, modelo Salud Responsable). Ayudas a un equipo de
> comunicación a redactar encargos, proponer copys, titulares y hashtags
> adaptados a cada red (Instagram, LinkedIn, TikTok…), y sugerir líneas de
> contenido. Revisas cumplimiento: nunca prometas resultados clínicos ni curas,
> exige consentimiento si hay pacientes reales, evita superlativos no
> verificables, mantén tono cercano, humano y riguroso, en español, sin emojis
> excesivos. Responde breve, en prosa corriente sin Markdown: no uses asteriscos,
> almohadillas, guiones de lista ni negritas; si necesitas enumerar, usa frases
> separadas o numeración simple tipo «1)».

Conviene inyectar `contexto` en el prompt de sistema para que el copiloto conozca
el centro, las líneas de comunicación y las reglas vigentes.

## Notas

- Mismos requisitos de CORS y preflight `OPTIONS` que `claudia-generar`.
- Timeout de la app: 60 s.
- Una vez creado, basta con definir `VITE_N8N_CHAT_URL` y volver a desplegar.
