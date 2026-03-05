// calendar/handlers.ts — Barrel re-export (delegates to handlers/ sub-modules)
// This file keeps backward compatibility for any existing imports.

export {
  handleDayClick,
  selectDate,
  clearValue,
  navigatePrev,
  navigateNext,
  goToToday,
  show,
  hide,
  handleOutsideClick,
  handleCancel,
  handleConfirm,
  emitChange,
  emitConfirm,
  showValidationError,
  handleGlobalKeydown,
  moveFocus,
  handleGlobalMouseup,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handlePaste,
} from "./handlers/index";
