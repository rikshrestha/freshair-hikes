import { Trail } from "../logic/recommend";

// Sample Kathmandu-area trails. Replace/extend with real OSM-derived data as available.
export const TRAILS_KATHMANDU: Trail[] = [
  {
    id: "ktm-1",
    name: "Shivapuri Nature Trail",
    difficulty: "Moderate",
    distanceMi: 3.2,
    estTimeMin: 90,
    why: "Forest climb with valley views",
    lat: 27.7935,
    lng: 85.3635,
    source: "local",
  },
  {
    id: "ktm-2",
    name: "Nagarjun Loop",
    difficulty: "Moderate",
    distanceMi: 4.8,
    estTimeMin: 150,
    why: "Stupa lookout and ridge walk",
    lat: 27.7408,
    lng: 85.2647,
    source: "local",
  },
  {
    id: "ktm-3",
    name: "Champadevi Ridge",
    difficulty: "Strenuous",
    distanceMi: 6.5,
    estTimeMin: 210,
    why: "Steady climb with panoramic views",
    lat: 27.6452,
    lng: 85.2745,
    source: "local",
  },
  {
    id: "ktm-4",
    name: "Patan Riverside Walk",
    difficulty: "Easy",
    distanceMi: 2.0,
    estTimeMin: 50,
    why: "Flat riverside stroll near city",
    lat: 27.6672,
    lng: 85.3282,
    source: "local",
  },
];
