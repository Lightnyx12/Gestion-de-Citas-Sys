import { useState } from "react";
import type { ModalType } from "./appointments.types";

// ─── Hook para gestionar el estado del modal de notificación ─────────────────
export const useNotificationModal = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<ModalType>("success");

  const openModal = (type: ModalType, title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalClosing(false);
      setModalOpen(false);
    }, 300);
  };

  return {
    modalOpen,
    modalClosing,
    modalTitle,
    modalMessage,
    modalType,
    openModal,
    closeModal,
  };
};
