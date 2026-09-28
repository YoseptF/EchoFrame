export type Story = {
  id: string;
  name: string;
  eyebrow: string;
  images: { file: string; alt: string; label: string }[];
  scenes: { text: string; tags: string[]; lead: number }[];
};

export const stories: Story[] = [
  {
    id: "wild",
    name: "Into the wild",
    eyebrow: "A little further from the ordinary",
    images: [
      {
        file: "forest",
        alt: "Sunlight pouring through a lush green forest",
        label: "Forest light",
      },
      {
        file: "mountains",
        alt: "Dramatic mountain peaks beneath a clouded sky",
        label: "Higher ground",
      },
      {
        file: "waterfall",
        alt: "Water cascading through a rocky green landscape",
        label: "Water in motion",
      },
    ],
    scenes: [
      {
        text: "There’s a moment in the forest when everything goes quiet. And you start to notice the light.",
        tags: ["forest", "light", "nature", "trees", "green"],
        lead: 0,
      },
      {
        text: "Beyond the trees, the mountains open up. Suddenly, our everyday worries feel a little smaller.",
        tags: ["mountains", "peaks", "adventure", "hiking"],
        lead: 1,
      },
      {
        text: "We follow the sound of water. A waterfall breaks the silence, and the whole landscape comes alive.",
        tags: ["waterfall", "water", "river", "landscape"],
        lead: 2,
      },
    ],
  },
  {
    id: "city",
    name: "After hours",
    eyebrow: "Every window has a story",
    images: [
      {
        file: "city",
        alt: "A dense city skyline illuminated after dark",
        label: "City of light",
      },
      {
        file: "skyline",
        alt: "Skyscrapers rising above the city",
        label: "Looking up",
      },
      {
        file: "streets",
        alt: "An expansive cityscape with streets between buildings",
        label: "Between the buildings",
      },
    ],
    scenes: [
      {
        text: "When the sun goes down, the city finds another voice. A thousand lights, a thousand stories.",
        tags: ["city", "lights", "night", "urban"],
        lead: 0,
      },
      {
        text: "Look up. The skyline is a record of all the things we once thought were impossible.",
        tags: ["skyline", "architecture", "buildings", "skyscrapers"],
        lead: 1,
      },
      {
        text: "But the real story is down in the streets. In the small moments between the big destinations.",
        tags: ["streets", "travel", "people", "destinations"],
        lead: 2,
      },
    ],
  },
  {
    id: "space",
    name: "Beyond our orbit",
    eyebrow: "A different sense of perspective",
    images: [
      {
        file: "earth",
        alt: "Earth’s curved horizon seen from space",
        label: "Our blue home",
      },
      {
        file: "nebula",
        alt: "Brilliant clouds of gas and stars in a distant nebula",
        label: "Stellar nursery",
      },
      {
        file: "stars",
        alt: "A field of stars stretching across the night sky",
        label: "An infinite sky",
      },
    ],
    scenes: [
      {
        text: "From up here, Earth has no borders. Just one small, extraordinary place we all call home.",
        tags: ["earth", "planet", "home", "orbit"],
        lead: 0,
      },
      {
        text: "Far beyond our world, a nebula is making new stars. The universe is still a work in progress.",
        tags: ["nebula", "universe", "cosmos", "galaxy"],
        lead: 1,
      },
      {
        text: "Every star is a reminder: there is so much left to discover. Our story is only just beginning.",
        tags: ["star", "stars", "space", "sky", "discover"],
        lead: 2,
      },
    ],
  },
];

// This preview deliberately uses local keyword matching, not a live AI service.
export function matchStory(text: string) {
  const words = new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);
  let best: { story: Story; sceneIndex: number; score: number } | undefined;
  for (const story of stories) {
    story.scenes.forEach((scene, sceneIndex) => {
      const score = scene.tags.filter((tag) => words.has(tag)).length;
      if (score > 0 && (!best || score > best.score))
        best = { story, sceneIndex, score };
    });
  }
  return best;
}
