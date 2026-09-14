import { sitePath } from "./site-path";

const spreadVisualCardPaths: Record<string, string[]> = {
  daily: ["/cards/m02.jpg"],
  timeline: ["/cards/m17.jpg", "/cards/m06.jpg", "/cards/m19.jpg"],
  choice: ["/cards/s02.jpg", "/cards/w02.jpg", "/cards/c02.jpg", "/cards/p02.jpg", "/cards/m11.jpg"],
  venus: ["/cards/m03.jpg", "/cards/m04.jpg", "/cards/c02.jpg", "/cards/s02.jpg", "/cards/m06.jpg", "/cards/m14.jpg", "/cards/m17.jpg"],
};

export const spreadVisualCards: Record<string, string[]> = Object.fromEntries(
  Object.entries(spreadVisualCardPaths).map(([spreadId, paths]) => [spreadId, paths.map(sitePath)]),
);
