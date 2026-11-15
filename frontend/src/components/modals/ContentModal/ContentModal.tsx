import { type ReactNode } from 'react';
import Modal from 'react-bootstrap/Modal';

import './ContentModal.module.scss';

interface ContentModalProps {
  children: ReactNode;
  onHide: () => void;
  show: boolean;
  title: string;
}

const ContentModal = ({
  children,
  onHide,
  show,
  title,
}: ContentModalProps) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      size="lg"
      dialogClassName="content-modal"
      centered
    >
    <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
    </Modal>
  );
};

export default ContentModal;
