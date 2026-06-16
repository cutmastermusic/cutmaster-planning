/**
 * Simulates CoupleHeroPhoto render branch decisions without React.
 * Run: npx tsx scripts/simulate-couple-hero-photo-trace.ts
 */

type Transform = {
  scale: number;
  x: number;
  y: number;
  baseWidthPercent: number;
  baseHeightPercent: number;
};

function renderBranch(input: {
  showSkeleton: boolean;
  isEventSpecific: boolean;
  displayUrl?: string;
  decodedUrl?: string;
}) {
  const { showSkeleton, isEventSpecific, displayUrl, decodedUrl } = input;
  if (showSkeleton) return "skeleton";
  if (isEventSpecific && displayUrl && decodedUrl) return "event-specific";
  if (!isEventSpecific && displayUrl) return "global-default";
  if (!displayUrl) return "placeholder";
  return "null-blank";
}

function photoReady(decodedUrl?: string, photoVisible?: boolean) {
  return decodedUrl ? Boolean(photoVisible) : true;
}

console.log("=== Scenario A: global default, first paint after save ===");
console.log(
  renderBranch({
    showSkeleton: false,
    isEventSpecific: false,
    displayUrl: "data:image/jpeg;base64,abc",
    decodedUrl: undefined,
  }),
  "photoReady=",
  photoReady(undefined, false),
);

console.log("\n=== Scenario B: event-specific, displayUrl set, decodedUrl not ready ===");
console.log(
  renderBranch({
    showSkeleton: false,
    isEventSpecific: true,
    displayUrl: "https://example.com/cover.jpg",
    decodedUrl: undefined,
  }),
);

console.log("\n=== Scenario C: photoVisible stuck false after replace (global default) ===");
console.log(
  renderBranch({
    showSkeleton: false,
    isEventSpecific: false,
    displayUrl: "data:image/jpeg;base64,new",
    decodedUrl: "data:image/jpeg;base64,new",
  }),
  "photoReady=",
  photoReady("data:image/jpeg;base64,new", false),
);

console.log("\n=== Scenario D: resolveCoupleWelcomePhotoDisplay with event storage path ===");
function resolve(input: {
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
  defaultWelcomePhotoDataUrl?: string;
}) {
  const isEventSpecific =
    Boolean(input.coverPhotoStoragePath?.trim()) ||
    Boolean(input.coverPhotoDataUrl?.trim()?.startsWith("http")) ||
    Boolean(input.coverPhotoDataUrl?.trim());
  if (isEventSpecific) {
    return {
      displayUrl: input.coverPhotoDataUrl?.trim(),
      isEventSpecific: true,
    };
  }
  const defaultUrl = input.defaultWelcomePhotoDataUrl?.trim();
  if (defaultUrl) {
    return { displayUrl: defaultUrl, isEventSpecific: false };
  }
  return { displayUrl: undefined, isEventSpecific: false };
}

console.log(
  "event storagePath only:",
  resolve({
    coverPhotoStoragePath: "evt/welcome.jpg",
    coverPhotoDataUrl: undefined,
    defaultWelcomePhotoDataUrl: "data:image/jpeg;base64,global",
  }),
);

console.log(
  "no event photo, global default:",
  resolve({
    defaultWelcomePhotoDataUrl: "data:image/jpeg;base64,global",
  }),
);

console.log("\n=== Scenario E: preload early-return leaves photoVisible false ===");
let displayedIdentityRef: string | undefined = "default|old|";
let decodedUrl: string | undefined = "data:old";
let photoVisible = true;

function simulateSaveReplace() {
  const nextIdentity = 'default|data:new|{"scale":1,"x":0,"y":0,"baseWidthPercent":99.6,"baseHeightPercent":100}';
  const shouldAnimate = Boolean(displayedIdentityRef);
  // preload onload
  displayedIdentityRef = nextIdentity;
  decodedUrl = "data:new";
  if (shouldAnimate) {
    photoVisible = false;
    // rAF cancelled because effect re-ran (activeTransform dep)
    const rafCancelled = true;
    if (rafCancelled) {
      // photoVisible stays false
    }
  }
}

simulateSaveReplace();
console.log({
  decodedUrl,
  photoVisible,
  photoReady: photoReady(decodedUrl, photoVisible),
  renderBranch: renderBranch({
    showSkeleton: false,
    isEventSpecific: false,
    displayUrl: "data:new",
    decodedUrl,
  }),
});
