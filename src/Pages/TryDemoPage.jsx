import React from "react";
import { useTranslation } from "react-i18next";
// import CreateShenaiSDK from "../../shenai-sdk/index.mjs";
import "../App.css";

export default function TryDemoPage() {
  const { t } = useTranslation();
  
  // --------------------------------
  // Return the same HTML "body" that
  // was in your old index.html
  // --------------------------------
  return (
    <>
      <div id="stage" className="state-loading">
        {/* <div id="instruction"></div>
        <div id="progress"></div> */}
        <div id="canvas-wrapper">
          <canvas id="mxcanvas"></canvas>
        </div>
        {/* <div id="heart-rate"></div>
        <div id="results"></div>
        <a
          id="download-intervals"
          className="hidden"
          href=""
          download="heartbeats.csv"
        >
          <button>{t('tryDemo.downloadButton')}</button>
        </a> */}
        {/* <button id="compute-risks">{t('tryDemo.computeRisks')}</button>
        <form id="health-risks-factors" className="hidden">
          <label htmlFor="age">{t('tryDemo.form.age')}</label>
          <input type="number" name="age" id="age" />
          <label htmlFor="cholesterol">{t('tryDemo.form.cholesterol')}</label>
          <input type="number" name="cholesterol" id="cholesterol" />
          <label htmlFor="cholesterolHdl">{t('tryDemo.form.cholesterolHdl')}</label>
          <input type="number" name="cholesterolHdl" id="cholesterolHdl" />
          <label htmlFor="sbp">{t('tryDemo.form.sbp')}</label>
          <input type="number" name="sbp" id="sbp" />
          <label htmlFor="smoker">{t('tryDemo.form.smoker')}</label>
          <input type="checkbox" name="smoker" id="smoker" />
          <label htmlFor="hypertensionTreatment">
            {t('tryDemo.form.hypertensionTreatment')}
          </label>
          <input
            type="checkbox"
            name="hypertensionTreatment"
            id="hypertensionTreatment"
          />
          <label htmlFor="diabetes">{t('tryDemo.form.diabetes')}</label>
          <input type="checkbox" name="diabetes" id="diabetes" />
          <label htmlFor="bodyHeight">{t('tryDemo.form.bodyHeight')}</label>
          <input type="number" name="bodyHeight" id="bodyHeight" />
          <label htmlFor="bodyWeight">{t('tryDemo.form.bodyWeight')}</label>
          <input type="number" name="bodyWeight" id="bodyWeight" />
          <label htmlFor="gender">{t('tryDemo.form.gender')}</label>
          <input type="text" list="gender-list" name="gender" id="gender" />
          <label htmlFor="country">{t('tryDemo.form.country')}</label>
          <input type="text" name="country" id="country" />
          <label htmlFor="race">{t('tryDemo.form.race')}</label>
          <input type="text" list="race-list" name="race" id="race" />
          <input
            id="health-risks-submit"
            name="submit"
            type="submit"
            value={t('tryDemo.computeRisks')}
          />
        </form> */}

        <datalist id="gender-list">
          <option value="Male"></option>
          <option value="Female"></option>
          <option value="Other"></option>
        </datalist>

        <datalist id="race-list">
          <option value="White"></option>
          <option value="African-American"></option>
          <option value="Other"></option>
        </datalist>

        <div id="risks" className="hidden">
          <table id="health-risks-results">
            <tbody>
              <tr>
                <th>{t('tryDemo.risks.hardAndFatalEvents')}</th>
                <td id="coronaryDeathEventRisk">{t('tryDemo.risks.coronaryDeathEventRisk')}</td>
                <td id="fatalStrokeEventRisk">{t('tryDemo.risks.fatalStrokeEventRisk')}</td>
                <td id="totalCVMortalityRisk">{t('tryDemo.risks.totalCVMortalityRisk')}</td>
                <td id="hardCVEventRisk">{t('tryDemo.risks.hardCVEventRisk')}</td>
              </tr>
              <tr>
                <th>{t('tryDemo.risks.cvDiseases')}</th>
                <td id="overallRisk">{t('tryDemo.risks.overallRisk')}</td>
                <td id="coronaryHeartDiseaseRisk">
                  {t('tryDemo.risks.coronaryHeartDiseaseRisk')}
                </td>
                <td id="strokeRisk">{t('tryDemo.risks.strokeRisk')}</td>
                <td id="heartFailureRisk">{t('tryDemo.risks.heartFailureRisk')}</td>
                <td id="peripheralVascularDiseaseRisk">
                  {t('tryDemo.risks.peripheralVascularDiseaseRisk')}
                </td>
              </tr>
              <tr>
                <th>{t('tryDemo.risks.riskFactorsScores')}</th>
                <td id="ageScore">{t('tryDemo.risks.ageScore')}</td>
                <td id="sbpScore">{t('tryDemo.risks.sbpScore')}</td>
                <td id="smokingScore">{t('tryDemo.risks.smokingScore')}</td>
                <td id="diabetesScore">{t('tryDemo.risks.diabetesScore')}</td>
                <td id="bmiScore">{t('tryDemo.risks.bmiScore')}</td>
                <td id="cholesterolScore">{t('tryDemo.risks.cholesterolScore')}</td>
                <td id="cholesterolHdlScore">{t('tryDemo.risks.cholesterolHdlScore')}</td>
                <td id="totalScore">{t('tryDemo.risks.totalScore')}</td>
              </tr>
              <tr>
                <th>{t('tryDemo.risks.vascularAge')}</th>
                <td id="vascularAge">{t('tryDemo.risks.vascularAge')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
