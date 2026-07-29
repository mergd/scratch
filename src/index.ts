export {
  Agentation,
  PageFeedbackToolbarCSS,
  AnnotationPopupCSS,
  type AgentationProps,
  type DemoAnnotation,
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
export { AgentationFeedback, type AgentationFeedbackProps } from './AgentationFeedback';
export { useCircleGesture } from './use-circle-gesture';
