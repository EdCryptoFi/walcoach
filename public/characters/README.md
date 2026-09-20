# Characters

Drop the Walrus character images here. Square, transparent background, ~512 px.
PNG or SVG, one file per name below (`.png` preferred; `.svg` also works — the
site tries `.png` first, then `.svg`, then falls back to text if neither exists).

| File | Used for |
|---|---|
| `mascot` | Logo in the header, welcome dialog, push-notification icon, favicon |
| `forgetful` | "Before" walrus on the landing page (memory off) |
| `training` | Training — the coach |
| `food` | Food & cooking — the cook |
| `reading` | Reading & study — the student |
| `sleep` | Sleep |
| `focus` | Work & focus |
| `mind` | Mind & mood |
| `money` | Money |
| `digital` | Digital habits (optional) |
| `social` | Relationships (optional) |
| `creative` | Creative & hobbies (optional) |
| `life` | Everything else (optional; mascot is used if missing) |

Areas are defined in `src/areas.ts`.

## Poses (optional)

For each mentor you can add up to three extra poses, shown for a few seconds after a reply:

| File | Shown when |
|---|---|
| `<id>-talk.webp` | a normal reply |
| `<id>-happy.webp` | the reply celebrates ("great", "good work", "!") |
| `<id>-think.webp` | the reply ends with a question |

Ids: mind, focus, training, reading, pets, creative, food, life (life uses the mascot). Without pose
files the base image plays a small nod / bounce / tilt animation instead.
