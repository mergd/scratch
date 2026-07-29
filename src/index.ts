export {
  Scratch,
  PageFeedbackToolbarCSS,
  AnnotationPopupCSS,
  COLOR_OPTIONS,
  type ScratchProps,
  type AnnotationColorId,
  type DemoAnnotation,
  type FeedbackMailPayload,
  type AnnotationPopupCSSProps,
  type AnnotationPopupCSSHandle,
  type Annotation,
  identifyElement,
  identifyAnimationElement,
  getElementPath,
  getNearbyText,
  getElementClasses,
  isInShadowDOM,
  getShadowHost,
  closestCrossingShadow,
  loadAnnotations,
  saveAnnotations,
  getStorageKey,
} from './toolbar';
export * from './toolbar/components/icons';
export {
  ScratchFeedback,
  type ActivationKeybinding,
  type ScratchFeedbackProps,
} from './ScratchFeedback';
export {
  FeedbackGuide,
  shouldShowFeedbackGuide,
  type FeedbackGuideCopy,
  type FeedbackGuideProps,
} from './feedback-guide';
export { useCircleGesture } from './use-circle-gesture';
