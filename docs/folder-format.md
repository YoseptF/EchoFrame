# EchoFrame folder format

A folder of material for one talk, written as ordinary files so a person, a script, or an AI agent
can prepare it outside the app. The app imports it (a directory or a `.zip` of one) and exports
folders in the same shape, so it also works as a backup.

```
my-talk/
  echoframe.json
  images/forest.jpg
  audio/rain.mp3
  notes/transpiration.md
```

`echoframe.json` must sit at the top of the folder, or inside a single top-level directory of the
`.zip`. File paths in it are relative to the manifest.

```json
{
  "format": "echoframe.folder",
  "version": 1,
  "name": "The living forest",
  "config": { "mode": "spatial", "holdSeconds": 6 },
  "assets": [
    {
      "file": "images/forest.jpg",
      "name": "Forest canopy",
      "description": "Sunlight falling through a dense forest canopy onto moss and roots.",
      "tags": ["forest", "canopy", "water cycle"]
    },
    {
      "name": "Transpiration",
      "text": "Plants take up water through their roots and release it as vapor through their leaves.",
      "tags": ["transpiration", "water vapor"]
    }
  ]
}
```

| Field                  | Required  | Meaning                                                                                                                                                     |
| ---------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`, `version`    | yes       | Always `"echoframe.folder"` and `1`.                                                                                                                        |
| `name`                 | no        | The folder's name when importing as a new folder. Ignored when adding to an existing folder.                                                                |
| `config`               | no        | Echo settings for a new folder: `mode`, `windowSeconds`, `holdSeconds`, `weights`, `language`. Missing or invalid values fall back to defaults.             |
| `assets[].file`        | one of    | Path to an image, audio file, or `.txt`/`.md` note. The kind comes from the extension.                                                                      |
| `assets[].text`        | one of    | An inline note. Use this instead of `file` for short text.                                                                                                  |
| `assets[].name`        | no        | The title shown on stage, so write it for the audience ("Iron Man (2008)", not "img_3 poster"). Defaults to the file name without its extension, or "Note". |
| `assets[].description` | for media | What the image or clip shows or says. **Jev matches speech against words, not pixels**: media without a description is never brought forward.               |
| `assets[].tags`        | no        | Short lowercase topics. Duplicates and extra spaces are removed.                                                                                            |

Other fields, such as `source` or `license` for attribution, are allowed and ignored.

Supported extensions: images `jpg jpeg png webp gif avif svg`, audio `mp3 m4a aac wav ogg oga
opus flac weba`, notes `txt md markdown`. Entries with a missing file, an unsupported type, or
neither `file` nor `text` are skipped and reported; the rest are imported.

## Writing descriptions that Jev can match

- Describe what is visible or audible and why it matters to the talk: "Tony Stark's first armor,
  built from scrap in a cave", not "image 3".
- Name the people, places, and ideas a speaker would say out loud.
- Keep tags to the topics you expect to talk about; they are matched as words, not as IDs.
