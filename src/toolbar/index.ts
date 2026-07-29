// =============================================================================
// Agentation
// =============================================================================
//
// A floating toolbar for collecting structured user feedback on web apps.
// End users mark what's confusing; developers/agents still get DOM context.
//
// Usage:
//   import { Agentation } from '@fldr/agentation';
//   <Agentation />
//
// =============================================================================

// Main components
// CSS-only version (default - zero runtime deps)
export { PageFeedbackToolbarCSS as Agentation } from "./components/page-toolbar-css";
export { PageFeedbackToolbarCSS, COLOR_OPTIONS } from "./components/page-toolbar-css";
export type {
  DemoAnnotation,
  AgentationProps,
  AnnotationColorId,
  FeedbackMailPayload,
} from "./components/page-toolbar-css";

// Shared components (for building custom UIs)
export { AnnotationPopupCSS } from "./components/annotation-popup-css";
export type {
  AnnotationPopupCSSProps,
  AnnotationPopupCSSHandle,
} from "./components/annotation-popup-css";

// Icons (same for both versions - they're pure SVG)
export * from "./components/icons";

// Utilities (for building custom UIs)
export {
  identifyElement,
  identifyAnimationElement,
  getElementPath,
  getNearbyText,
  getElementClasses,
  // Shadow DOM support
  isInShadowDOM,
  getShadowHost,
  closestCrossingShadow,
} from "./utils/element-identification";

export {
  loadAnnotations,
  saveAnnotations,
  getStorageKey,
} from "./utils/storage";

// Types
export type { Annotation } from "./types";
