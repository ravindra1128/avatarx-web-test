import React from "react";
import { useTranslation } from "react-i18next";
import "./CostSaving.css"; // Import the CSS file

function CostSaving() {
  const { t } = useTranslation();
  return (
    <section className="stepin-section">
      <h2>
        {t('landing.costSaving.title')}
      </h2>
    </section>
  );
}

export default CostSaving;
