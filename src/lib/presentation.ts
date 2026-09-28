export const modes = [
  {
    id: "presentation",
    name: "Presentation",
    label: "One idea. A room that gets it.",
    description:
      "A composed slide with a headline, a focal visual, and space for the point to land. Change direction without rebuilding your deck.",
    rule: "Lead with one idea. Keep a clear visual hierarchy.",
  },
  {
    id: "backdrop",
    name: "Backdrop",
    label: "Set the scene. Stay in the spotlight.",
    description:
      "One full-bleed visual that follows the subject. A quiet background for the moments when your voice should do all the work.",
    rule: "Choose one relevant background. Keep the stage clear.",
  },
  {
    id: "spatial",
    name: "Spatial",
    label: "Think out loud. Watch the context assemble.",
    description:
      "Images, explanations, and relationships form an information space around your talk. Relevant material comes forward; useful context stays within reach.",
    rule: "Surface connected context. Recompose around the current thought.",
  },
] as const;

export type FrameMode = (typeof modes)[number]["id"];

// One authored talk, rendered three ways. These are illustrative frames, not live Jev output.
export const scenes = [
  {
    id: "system",
    cue: "The big picture",
    title: "The forest is a water engine.",
    transcript:
      "Look past the trees for a moment. A forest is a living water system, connecting the soil beneath our feet with the air above us.",
    focus: "a living water system",
    image: "forest",
    alt: "Sunlight filtering through a forest canopy down to the soil",
    tags: ["forest", "water cycle", "connected system"],
    contextTitle: "A connected system",
    context:
      "Water moves through the soil, into plants, and back to the atmosphere.",
    action: {
      presentation:
        "Establish one idea with a headline and one supporting visual.",
      backdrop:
        "Use the forest as the sole background. Leave the stage free of text.",
      spatial:
        "Connect the forest image to an explanation and its water pathway.",
    },
  },
  {
    id: "transpiration",
    cue: "Follow the mechanism",
    title: "The invisible part of the journey.",
    transcript:
      "Here’s the part we don’t see: roots take up water from the soil, and leaves release it into the air as vapor. That process is called transpiration.",
    focus: "That process is called transpiration.",
    image: "forest",
    alt: "Forest leaves and trunks illustrating the plant pathway for water",
    tags: ["transpiration", "roots", "water vapor"],
    contextTitle: "Transpiration",
    context:
      "Plants take up water through their roots and release it as vapor through their leaves.",
    action: {
      presentation:
        "Move from the opening idea to an explanation and a pathway diagram.",
      backdrop:
        "Hold the forest background while the speaker develops the same subject.",
      spatial:
        "Promote the explanation and pathway. Keep the forest as supporting context.",
    },
  },
  {
    id: "connection",
    cue: "Connect it back",
    title: "From the ground. Back to the sky.",
    transcript:
      "So when we look at a forest, we’re also looking at part of the water cycle. The trees, the water, and the atmosphere are connected.",
    focus: "The trees, the water, and the atmosphere are connected.",
    image: "waterfall",
    alt: "A waterfall surrounded by forest, connecting the story back to the water cycle",
    tags: ["water cycle", "forest", "atmosphere"],
    contextTitle: "Ground ↔ sky",
    context:
      "Transpiration connects water in the soil to moisture in the atmosphere.",
    action: {
      presentation:
        "Bring the talk back to one takeaway, supported by the water scene.",
      backdrop:
        "Change to the waterfall as the talk widens to the water cycle.",
      spatial:
        "Widen the view. Connect the forest, the water, and the atmosphere.",
    },
  },
] as const;

export type FrameScene = (typeof scenes)[number];
export const scienceSource = {
  title: "USGS · Evapotranspiration and the Water Cycle",
  url: "https://www.usgs.gov/water-science-school/science/evapotranspiration-and-water-cycle",
};
