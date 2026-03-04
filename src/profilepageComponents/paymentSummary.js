// PaymentSummary.jsx
import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import cardsImg from "../assets/cards.png";
import libanPostImg from "../assets/libanpost.png";
import paymentMethodsImg from "../assets/paymentmethods.png";
import lockImg from "../assets/lock.png";
import arrowSvg from "../assets/arrow-long-right-blue.svg";

const PaymentSummary = ({ data, busy, onClose, onPay }) => {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState("USD");
  const [method, setMethod] = useState("card");

  const totalWithDuty = data.totalCIFValue + data.totalCustomsDuty;
  const vat = totalWithDuty * (data.vatPercentage / 100);
  const totalPayable = data.totalCustomsDuty + vat;

  const formatted = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <Wrapper>
      <Card>
        <SectionTitle>
          <img onClick={onClose} src={arrowSvg} style={{ transform: "rotate(180deg", padding: 10, cursor: "pointer" }} />
          {t("PAYMENT SUMMARY")}
        </SectionTitle>

        <SummaryBox>
          <Row>
            <span>{t("Total Value")}</span>
            <span>{formatted(data.totalCIFValue)}</span>
          </Row>
          <Row style={{ borderColor: "#C1C1C1" }}>
            <span>{t("Total Customs Duty")}</span>
            <strong>{formatted(data.totalCustomsDuty)}</strong>
          </Row>
          <Row>
            <span>{t("Total (Value + Customs Duty)")}</span>
            <span>{formatted(totalWithDuty)}</span>
          </Row>
          <Row style={{ border: 0 }}>
            <span>{t("VAT")} ({data.vatPercentage}%)</span>
            <strong>+{formatted(vat)}</strong>
          </Row>
        </SummaryBox>

        <TotalBox>
          <Left>
            <strong>TOTAL PAYABLE</strong> (TOTAL CUSTOMS DUTY + VAT)
          </Left>

          <Right>
            <MainAmount>{formatted(totalPayable)}</MainAmount>
            <Approx>
              ≈ {(totalPayable * data.usdToLbpRate).toLocaleString()} LBP
            </Approx>
            <Rate>
              Exchange Rate: {data.usdToLbpRate.toLocaleString()} USD/LBP
            </Rate>
          </Right>
        </TotalBox>

        <SectionTitle>{t("Payment Currency")}</SectionTitle>
        <CurrencyRow>
          <CurrencyOption onClick={() => !busy && setCurrency("USD")}>
            <RadioOuter active={currency === "USD"}>
              {currency === "USD" && <RadioInner />}
            </RadioOuter>
            <span>USD</span>
          </CurrencyOption>

          <CurrencyOption onClick={() => !busy && setCurrency("LBP")}>
            <RadioOuter active={currency === "LBP"}>
              {currency === "LBP" && <RadioInner />}
            </RadioOuter>
            <span>LBP</span>
          </CurrencyOption>
        </CurrencyRow>

        <SectionTitle>{t("paymentMethod")}</SectionTitle>

        <MethodRow>
          <MethodCard
            active={method === "card"}
            onClick={() => !busy && setMethod("card")}
          >
            <CheckBadge active={method === "card"}>✓</CheckBadge>

            <IconWrapper>
              <img src={cardsImg} style={{ height: 32 }} alt="cards" />
            </IconWrapper>

            <MethodLabel>CREDIT / DEBIT CARD</MethodLabel>
          </MethodCard>

          <MethodCard
            active={method === "libanpost"}
            onClick={() => !busy && setMethod("libanpost")}
          >
            <CheckBadge active={method === "libanpost"}>✓</CheckBadge>

            <IconWrapper>
              <img src={libanPostImg} style={{ height: 58 }} alt="libanpost" />
            </IconWrapper>

            <MethodLabel>LIBANPOST</MethodLabel>
          </MethodCard>

          <MethodCard
            active={method === "other"}
            onClick={() => !busy && setMethod("other")}
          >
            <CheckBadge active={method === "other"}>✓</CheckBadge>

            <IconWrapper>
              <img src={paymentMethodsImg} style={{ height: 50, borderRadius: 9 }} alt="other methods" />
            </IconWrapper>

            <MethodLabel>OTHER PAYMENT METHODS</MethodLabel>
          </MethodCard>
        </MethodRow>

        <PayButton onClick={() => onPay()} disabled={busy} style={busy ? { opacity: 0.5, cursor: "default" } : null}>
          <img src={lockImg} style={{ height: 16 }} alt="lock" />
          {t("Pay")} {formatted(totalPayable)} {t("Now")}
        </PayButton>
      </Card>
    </Wrapper>
  );
};

export default PaymentSummary;

/* ================= STYLES ================= */

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  justify-content: center;
  padding: 30px;
  background: #f3f4f6;
`;

const Card = styled.div`
  width: 900px;
  margin:0 auto;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  padding-top:20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  margin: 0;
  font-size:15px;
  letter-spacing:1px;
  text-transform: uppercase;
`;

const SummaryBox = styled.div`
  background: #F8FAF9;
  padding: 15px;
  padding-bottom:5px;
  border-radius: 12px;
  margin-top: 14px;
  font-size:12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom:1px solid #E7F0EC;
`;

const TotalBox = styled.div`
  margin: 10px 0 15px 0;
  padding: 13px 18px;
  border-radius: 14px;
  border: 2px solid #2e7d32;
  background: #eef7f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Left = styled.div`
  font-size: 14px;
`;

const Right = styled.div`
  text-align: right;
`;

const MainAmount = styled.div`
  font-size: 25px;
  font-weight: 900;
  color: #1b5e20;
`;

const Approx = styled.div`
  font-size: 12px;
  margin-top: 4px;
`;

const Rate = styled.div`
  font-size: 10px;
  margin-top: 2px;
  color: #6b7280;
`;

const CurrencyRow = styled.div`
	margin:15px 0;
  display: flex;
  gap: 32px;
  align-items: center;
`;

const CurrencyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size:12px;
`;

const RadioOuter = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${p => (p.active ? "#2e7d32" : "#cbd5e1")};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s ease;
`;

const RadioInner = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2e7d32;
`;

const MethodRow = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 16px;
`;

const MethodCard = styled.div`
  position: relative;
  flex: 1;
  padding: 28px 20px;
  border-radius: 14px;
  border: 2px solid ${p => (p.active ? "#2e7d32" : "#e5e7eb")};
  background: ${p => (p.active ? "#eef7f1" : "#fff")};
  cursor: pointer;
  transition: 0.2s ease;
  text-align: center;

  &:hover {
    border-color: #2e7d32;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height:50px;
  margin-bottom: 18px;

  img {
    object-fit: contain;
  }
`;

const MethodLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const CheckBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${p => (p.active ? "#2e7d32" : "transparent")};
  color: white;
  font-size: 13px;
  display: ${p => (p.active ? "flex" : "none")};
  align-items: center;
  justify-content: center;
`;

const PayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  width: 100%;
  padding: 16px;
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight:900;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 
    0 10px 20px rgba(46, 125, 50, 0.25),
    0 4px 6px rgba(46, 125, 50, 0.2);
  &:hover {
    opacity: 0.9;
  }
  img{
    top: -1px;
    position: relative;
    height: 16px;
    margin-right: 4px;
  }
`;