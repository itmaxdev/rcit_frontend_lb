import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import cardsImg from "../assets/cards.png";
import libanPostImg from "../assets/libanpost.png";
import paymentMethodsImg from "../assets/paymentmethods.png";
import lockImg from "../assets/lock.png";

const PaymentSummary = ({ data, busy, onPay, paid = false }) => {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState("USD");
  const [method, setMethod] = useState("card");

  const approvedTotal = Number(
    data.totalApprovedValue ?? data.totalDeclaredValue ?? data.totalCIFValue ?? 0
  );
  const customsDutyTotal = Number(data.totalCustomsDuty ?? 0);
  const dutyPercentage = Number(data.dutyPercentage ?? 0);
  const totalWithDuty = Number(data.totalWithDuty ?? approvedTotal + customsDutyTotal);
  const vat = Number(
    data.vatAmount ?? totalWithDuty * (Number(data.vatPercentage ?? 0) / 100)
  );
  const totalPayable = Number(data.totalPayable ?? customsDutyTotal + vat);

  const formatted = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <Card>
      <CardTopRow>
        <CardTitle>{t("PAYMENT SUMMARY")}</CardTitle>
        {paid ? (
          <PayStatusBadge $paid>{t("Paid Successfully")}</PayStatusBadge>
        ) : (
          <PayStatusBadge>{t("Awaiting Payment")}</PayStatusBadge>
        )}
      </CardTopRow>

      <SummaryBox>
        <SummaryRow>
          <span>{t("Total Approved Value")}</span>
          <span>{formatted(approvedTotal)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>{t("Total Customs Duty")} ({dutyPercentage}%)</span>
          <strong>{formatted(customsDutyTotal)}</strong>
        </SummaryRow>
        <SummaryRow>
          <span>{t("Total (Approved Value + Customs Duty)")}</span>
          <span>{formatted(totalWithDuty)}</span>
        </SummaryRow>
        <SummaryRow $last>
          <span>{t("VAT")} ({data.vatPercentage}%)</span>
          <strong>+{formatted(vat)}</strong>
        </SummaryRow>
      </SummaryBox>

      <TotalBox>
        <TotalLeft>
          <strong>{t("TOTAL PAYABLE")}</strong>{" "}
          <TotalSub>({t("TOTAL CUSTOMS DUTY + VAT")})</TotalSub>
        </TotalLeft>
        <TotalRight>
          <TotalAmount>{formatted(totalPayable)}</TotalAmount>
          <TotalApprox>
            ≈ {(totalPayable * data.usdToLbpRate).toLocaleString()} LBP
          </TotalApprox>
          <TotalRate>
            {t("Exchange Rate")}: {data.usdToLbpRate?.toLocaleString()} USD/LBP
          </TotalRate>
        </TotalRight>
      </TotalBox>

      {!paid && (
        <>
          <SectionLabel>{t("PAYMENT CURRENCY")}</SectionLabel>
          <CurrencyRow>
            <CurrencyOption onClick={() => !busy && setCurrency("USD")}>
              <RadioOuter $active={currency === "USD"}>
                {currency === "USD" && <RadioInner />}
              </RadioOuter>
              <span>USD</span>
            </CurrencyOption>
            <CurrencyOption onClick={() => !busy && setCurrency("LBP")}>
              <RadioOuter $active={currency === "LBP"}>
                {currency === "LBP" && <RadioInner />}
              </RadioOuter>
              <span>LBP</span>
            </CurrencyOption>
          </CurrencyRow>

          <SectionLabel>{t("PAYMENT METHOD")}</SectionLabel>
          <MethodRow>
            <MethodCard $active={method === "card"} onClick={() => !busy && setMethod("card")}>
              <CheckBadge $active={method === "card"}>
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </CheckBadge>
              <MethodIconBox>
                <img src={cardsImg} style={{ height: 32 }} alt="cards" />
              </MethodIconBox>
              <MethodLabel>{t("CREDIT / DEBIT CARD")}</MethodLabel>
            </MethodCard>

            <MethodCard $active={method === "libanpost"} onClick={() => !busy && setMethod("libanpost")}>
              <CheckBadge $active={method === "libanpost"}>
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </CheckBadge>
              <MethodIconBox>
                <img src={libanPostImg} style={{ height: 50 }} alt="libanpost" />
              </MethodIconBox>
              <MethodLabel>{t("LIBANPOST")}</MethodLabel>
            </MethodCard>

            <MethodCard $active={method === "other"} onClick={() => !busy && setMethod("other")}>
              <CheckBadge $active={method === "other"}>
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </CheckBadge>
              <MethodIconBox>
                <img src={paymentMethodsImg} style={{ height: 48, borderRadius: 8 }} alt="other methods" />
              </MethodIconBox>
              <MethodLabel>{t("OTHER PAYMENT METHODS")}</MethodLabel>
            </MethodCard>
          </MethodRow>

          <PayButton onClick={onPay} disabled={busy} $busy={busy}>
            <img src={lockImg} style={{ height: 16, marginRight: 8 }} alt="" />
            {t("PAY")} {formatted(totalPayable)} {t("NOW")}
          </PayButton>
        </>
      )}
    </Card>
  );
};

export default PaymentSummary;

const Card = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  border: 1px solid #e8eaf0;
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1d2025;
  text-transform: uppercase;
  margin: 0;
`;

const PayStatusBadge = styled.span`
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  background: ${({ $paid }) => ($paid ? "#eef6ef" : "#e8f1ff")};
  color: ${({ $paid }) => ($paid ? "#1c9d4b" : "#2671d9")};
`;

const SummaryBox = styled.div`
  background: #f8faf9;
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 16px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 13px;
  color: #1d2025;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px solid #e7f0ec")};
`;

const TotalBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1.5px solid #2e7d32;
  background: #eef7f1;
  margin-bottom: 24px;
`;

const TotalLeft = styled.div`
  font-size: 14px;
  color: #1d2025;
`;

const TotalSub = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #6f7897;
`;

const TotalRight = styled.div`
  text-align: right;
`;

const TotalAmount = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: #1b5e20;
`;

const TotalApprox = styled.div`
  font-size: 12px;
  color: #6f7897;
  margin-top: 2px;
`;

const TotalRate = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;

const SectionLabel = styled.h4`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #1d2025;
  margin: 0 0 14px;
`;

const CurrencyRow = styled.div`
  display: flex;
  gap: 28px;
  align-items: center;
  margin-bottom: 22px;
`;

const CurrencyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #1d2025;
  user-select: none;
`;

const RadioOuter = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => ($active ? "#436c4d" : "#d4d6df")};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s;
`;

const RadioInner = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #436c4d;
`;

const MethodRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
  justify-content: center;
`;

const MethodCard = styled.div`
  position: relative;
  flex: 1;
  max-width: 240px;
  padding: 20px 16px;
  border-radius: 12px;
  border: 2px solid ${({ $active }) => ($active ? "#436c4d" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#eef7f1" : "#fff")};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;

  &:hover {
    border-color: #436c4d;
  }
`;

const CheckBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #436c4d;
  display: ${({ $active }) => ($active ? "flex" : "none")};
  align-items: center;
  justify-content: center;
`;

const MethodIconBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 52px;
  margin-bottom: 14px;

  img {
    object-fit: contain;
  }
`;

const MethodLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1d2025;
  letter-spacing: 0.3px;
`;

const PayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 18px;
  background: #436c4d;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: ${({ $busy }) => ($busy ? "not-allowed" : "pointer")};
  opacity: ${({ $busy }) => ($busy ? 0.6 : 1)};
  text-transform: uppercase;
  transition: opacity 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;
