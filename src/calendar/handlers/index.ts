// calendar/handlers/index.ts — Re-exports all handler functions

export { handleDayClick, selectDate, clearValue } from "./selection";
export { navigatePrev, navigateNext, goToToday } from "./navigation";
export {
  show,
  hide,
  handleOutsideClick,
  handleCancel,
  handleConfirm,
  emitChange,
  emitConfirm,
  showValidationError,
} from "./show-hide";
export { handleGlobalKeydown, moveFocus, handleGlobalMouseup } from "./keyboard";
export { handleTouchStart, handleTouchMove, handleTouchEnd, handlePaste } from "./touch-paste";
