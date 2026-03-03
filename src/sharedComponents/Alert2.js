import React, { } from "react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";

export default function Alert2({
  title = "",
  message = "",
  buttons = ["OK"],
  onClick,
  options = { primary: 1 },
}) {
  const { t } = useTranslation();
  return (
    <Overlay>
      <Modal>
        <Title>{t(title)}</Title>
        <Message>{t(message)}</Message>
        <Actions>
          {buttons.map((itm, idx) => {
            if (options.primary === idx || buttons.length == 1) {
              return (
                <ButtonPrimary key={idx} onClick={() => onClick(idx)} >{t(itm)}</ButtonPrimary>
              )
            }
            if (options.danger === idx) {
              return (
                <ButtonDanger key={idx} onClick={() => onClick(idx)} >{t(itm)}</ButtonDanger>
              )
            }
            return (
              <ButtonNormal key={idx} onClick={() => onClick(idx)} >{t(itm)}</ButtonNormal>
            )
          })}
        </Actions>
      </Modal>
    </Overlay>
  );
}

const fadeInBox = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 360px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  animation: ${fadeInBox} 0.25s ease-out;
`;


const Title = styled.h2`
  font-size: 19px;
  font-weight: 600;
  margin: 8px 0 8px;
  color: #373F54;
`;

const Message = styled.p`
  font-size: 15px;
  color: #555;
  margin-bottom: 24px;
  color: #373F54;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const ButtonNormal = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 50px;
  background: white;
  font-size: 15px;
  cursor: pointer;
`;

const ButtonPrimary = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 50px;
  background: #436C4D;
  color: white;
  font-size: 15px;
  cursor: pointer;
`;

const ButtonDanger = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 50px;
  background: #e53935;
  color: white;
  font-size: 15px;
  cursor: pointer;
`;