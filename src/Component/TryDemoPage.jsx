import React, { useEffect } from "react";
import CreateShenaiSDK from "../../shenai-sdk/index.mjs";
import "../App.css";
// import Navbar from "./Component/NavBar";

export default function TryDemoPage() {
  useEffect(() => {
    (async function initialize() {
      const API_KEY = "62ad70ae10a84a028e615b781dd81a73";
      const USER_ID = "1234567890";

      function error(message) {
        document.getElementById("stage").className = "state-error";
        alert(message);
      }

      function showElement(elem) {
        elem.classList.remove("hidden");
      }

      function hideElement(elem) {
        elem.classList.add("hidden");
      }

      async function startShenai() {
        try {
          const shenai = await CreateShenaiSDK({
            onRuntimeInitialized: () => {},
          });

          shenai.initialize(API_KEY, USER_ID, {}, (result) => {
            if (result === shenai.InitializationResult.OK) {
              document.getElementById("stage").className = "state-loaded";
              beginPolling(shenai);
              document
                .getElementById("compute-risks")
                .addEventListener("click", () =>
                  showElement(document.getElementById("health-risks-factors"))
                );
              document
                .getElementById("health-risks-factors")
                .addEventListener("submit", (e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(
                    new FormData(e.target).entries()
                  );
                  computeRisks(shenai, data);
                });
            } else {
              error("Shen.AI license activation error " + result.toString());
            }
          });
        } catch (e) {
          error("Error: " + e);
        }
      }

      let finished = false;
      let wakeLock = "wakeLock" in navigator ? null : false;

      function beginPolling(shenai) {
        setInterval(() => pollHeartRate(shenai), 300);
        setInterval(() => pollFacePosition(shenai), 300);
        setInterval(() => pollMeasurement(shenai), 1000);
      }

      function pollHeartRate(shenai) {
        if (finished) return;
        const hr = shenai.getHeartRate10s();
        const hrElem = document.getElementById("heart-rate");
        hrElem.innerText = hr ? Math.round(hr) : "  ";
      }

      function FacePositionInstructions(shenai, faceState) {
        switch (faceState) {
          case shenai.FaceState.OK:
            return "Face well positioned";
          case shenai.FaceState.NOT_CENTERED:
            return "Move your head to the center";
          case shenai.FaceState.TOO_CLOSE:
            return "Move your head away from the camera";
          case shenai.FaceState.TOO_FAR:
            return "Move your head closer to the camera";
          case shenai.FaceState.UNSTABLE:
            return "Too much head movement";
          default:
            return "";
        }
      }

      function pollFacePosition(shenai) {
        if (finished) return;
        const facePosition = shenai.getFaceState();
        const instruction = FacePositionInstructions(shenai, facePosition);
        document.getElementById("instruction").innerText = instruction;

        const progress = shenai.getMeasurementProgressPercentage();
        if (progress > 0) {
          const progressElem = document.getElementById("progress");
          progressElem.innerText = `Progress: ${Math.round(progress)}%`;
        }
      }

      function makeCsvHref(columnNames, dataRows) {
        return (
          "data:text/csv," +
          encodeURI(
            "\n" +
              columnNames.join(",") +
              "\n" +
              dataRows.map((row) => row.join(",")).join("\n")
          )
        );
      }

      function presentResults(results) {
        document.getElementById("results").innerText = [
          `HR: ${results.heart_rate_bpm} BPM`,
          `HRV SDNN: ${results.hrv_sdnn_ms} ms`,
          `HRV lnRMSSD: ${results.hrv_lnrmssd_ms} ms`,
          `BR: ${Math.round(results.breathing_rate_bpm)} BPM`,
        ].join(", ");

        const intervals = results.heartbeats;
        if (intervals) {
          const csvColumnNames = [
            "start_time_sec",
            "end_time_sec",
            "duration_ms",
          ];
          const csvDataRows = intervals.map((i) => [
            i.start_location_sec.toFixed(3),
            i.end_location_sec.toFixed(3),
            i.duration_ms.toString(),
          ]);
          const download = document.getElementById("download-intervals");
          download.href = makeCsvHref(csvColumnNames, csvDataRows);
          showElement(download);
          localStorage.setItem(
            "intervals",
            csvDataRows.map((row) => row.join(",")).join(" ")
          );
        }
        document.getElementById("instruction").innerText =
          "Measurement complete!";
        document.getElementById("heart-rate").innerText = "";
        document.getElementById("progress").innerText = "";
      }

      function pollMeasurement(shenai) {
        const measurementState = shenai.getMeasurementState();
        if (measurementState === shenai.MeasurementState.FINISHED) {
          finished = true;
          if (wakeLock) wakeLock.release().then(() => (wakeLock = null));
          const results = shenai.getMeasurementResults();
          presentResults(results);
          return;
        }
        if (shenai.getOperatingMode() !== shenai.OperatingMode.MEASURE) {
          shenai.setOperatingMode(shenai.OperatingMode.MEASURE);
          localStorage.setItem("measuring", "true");
          if (wakeLock === null)
            navigator.wakeLock.request("screen").then((l) => (wakeLock = l));
        }
      }

      function presentRisks(shenai, risksFactors) {
        const risks = shenai.computeHealthRisks(risksFactors);
        const minRisks = shenai.getMinimalRisks(risksFactors);
        const maxRisks = shenai.getMaximalRisks(risksFactors);
        if (risks && minRisks && maxRisks) {
          showElement(document.getElementById("risks"));

          const displayRisks =
            (subRisks, subMinRisks, subMaxRisks) => (name) => {
              const risk = subRisks[name];
              const minRisk = subMinRisks[name];
              const maxRisk = subMaxRisks[name];
              if (risk !== null && minRisk !== null && maxRisk !== null) {
                const riskElem = document.getElementById(name);
                riskElem.innerText += `(${minRisk}-${maxRisk}): ${risk.toFixed(
                  1
                )}`;
              }
            };

          if (
            risks.hardAndFatalEvents &&
            minRisks.hardAndFatalEvents &&
            maxRisks.hardAndFatalEvents
          ) {
            const subRisks = risks.hardAndFatalEvents;
            const subMinRisks = minRisks.hardAndFatalEvents;
            const subMaxRisks = maxRisks.hardAndFatalEvents;
            [
              "coronaryDeathEventRisk",
              "fatalStrokeEventRisk",
              "totalCVMortalityRisk",
              "hardCVEventRisk",
            ].forEach(displayRisks(subRisks, subMinRisks, subMaxRisks));
          }

          if (risks.cvDiseases && minRisks.cvDiseases && maxRisks.cvDiseases) {
            const subRisks = risks.cvDiseases;
            const subMinRisks = minRisks.cvDiseases;
            const subMaxRisks = maxRisks.cvDiseases;
            [
              "overallRisk",
              "coronaryHeartDiseaseRisk",
              "strokeRisk",
              "heartFailureRisk",
              "peripheralVascularDiseaseRisk",
            ].forEach(displayRisks(subRisks, subMinRisks, subMaxRisks));
          }

          if (risks.scores && minRisks.scores && maxRisks.scores) {
            const subRisks = risks.scores;
            const subMinRisks = minRisks.scores;
            const subMaxRisks = maxRisks.scores;
            [
              "ageScore",
              "sbpScore",
              "smokingScore",
              "diabetesScore",
              "bmiScore",
              "cholesterolScore",
              "cholesterolHdlScore",
              "totalScore",
            ].forEach(displayRisks(subRisks, subMinRisks, subMaxRisks));
          }

          if (
            risks.vascularAge &&
            minRisks.vascularAge &&
            maxRisks.vascularAge
          ) {
            displayRisks(risks, minRisks, maxRisks)("vascularAge");
          }
        }
      }

      function computeRisks(shenai, data) {
        const risksFactors = {
          age: data.age,
          cholesterol: data.cholesterol,
          cholesterolHdl: data.cholesterolHdl,
          sbp: data.sbp,
          isSmoker: !!data.smoker,
          hypertensionTreatment: !!data.hypertensionTreatment,
          hasDiabetes: !!data.diabetes,
          bodyHeight: data.bodyHeight,
          bodyWeight: data.bodyWeight,
          gender:
            data.gender === "Male"
              ? shenai.Gender.MALE
              : data.gender === "Female"
              ? shenai.Gender.FEMALE
              : shenai.Gender.OTHER,
          country: data.country,
          race:
            data.race === "White"
              ? shenai.Race.WHITE
              : data.race === "African-American"
              ? shenai.Race.AFRICAN_AMERICAN
              : shenai.Race.OTHER,
        };

        presentRisks(shenai, risksFactors);

        const form = document.getElementById("health-risks-factors");
        form.reset();
        hideElement(form);
      }

      // kick off
      startShenai();

      // ============ end of original code ============
    })();
  }, []);

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
        <div id="results"></div> */}
        {/* <a
          id="download-intervals"
          className="hidden"
          href=""
          download="heartbeats.csv"
        >
          <button>Download heartbeat intervals</button>
        </a> */}
        {/* <button id="compute-risks">Compute Risks</button>
        <form id="health-risks-factors" className="hidden">
          <label htmlFor="age">Age (years):</label>
          <input type="number" name="age" id="age" />
          <label htmlFor="cholesterol">Cholesterol:</label>
          <input type="number" name="cholesterol" id="cholesterol" />
          <label htmlFor="cholesterolHdl">Cholesterol HDL:</label>
          <input type="number" name="cholesterolHdl" id="cholesterolHdl" />
          <label htmlFor="sbp">Systolic blood pressure:</label>
          <input type="number" name="sbp" id="sbp" />
          <label htmlFor="smoker">Current smoker:</label>
          <input type="checkbox" name="smoker" id="smoker" />
          <label htmlFor="hypertensionTreatment">
            Have hypertension treatment:
          </label>
          <input
            type="checkbox"
            name="hypertensionTreatment"
            id="hypertensionTreatment"
          />
          <label htmlFor="diabetes">Have diabetes:</label>
          <input type="checkbox" name="diabetes" id="diabetes" />
          <label htmlFor="bodyHeight">Body height (cm):</label>
          <input type="number" name="bodyHeight" id="bodyHeight" />
          <label htmlFor="bodyWeight">Body weight (kg):</label>
          <input type="number" name="bodyWeight" id="bodyWeight" />
          <label htmlFor="gender">Gender:</label>
          <input type="text" list="gender-list" name="gender" id="gender" />
          <label htmlFor="country">Country ISO code:</label>
          <input type="text" name="country" id="country" />
          <label htmlFor="race">Race</label>
          <input type="text" list="race-list" name="race" id="race" />
          <input
            id="health-risks-submit"
            name="submit"
            type="submit"
            value="Compute health risks"
          />
        </form> */}

        {/* <datalist id="gender-list">
          <option value="Male"></option>
          <option value="Female"></option>
          <option value="Other"></option>
        </datalist>

        <datalist id="race-list">
          <option value="White"></option>
          <option value="African-American"></option>
          <option value="Other"></option>
        </datalist> */}

        <div id="risks" className="hidden">
          <table id="health-risks-results">
            <tbody>
              <tr>
                <th>Hard and fatal events risks</th>
                <td id="coronaryDeathEventRisk">Coronary death event risk</td>
                <td id="fatalStrokeEventRisk">Fatal stroke event risk</td>
                <td id="totalCVMortalityRisk">Total CV mortality risk</td>
                <td id="hardCVEventRisk">Hard CV event risk</td>
              </tr>
              <tr>
                <th>CV diseases risks</th>
                <td id="overallRisk">Overall risk</td>
                <td id="coronaryHeartDiseaseRisk">
                  Coronary heart disease risk
                </td>
                <td id="strokeRisk">Stroke risk</td>
                <td id="heartFailureRisk">Heart failure risk</td>
                <td id="peripheralVascularDiseaseRisk">
                  Peripheral vascular disease risk
                </td>
              </tr>
              <tr>
                <th>Risks factors scores</th>
                <td id="ageScore">Age score</td>
                <td id="sbpScore">SBP score</td>
                <td id="smokingScore">Smoking score</td>
                <td id="diabetesScore">Diabetes score</td>
                <td id="bmiScore">BMI score</td>
                <td id="cholesterolScore">Cholesterol score</td>
                <td id="cholesterolHdlScore">Cholesterol HDL score</td>
                <td id="totalScore">Total score</td>
              </tr>
              <tr>
                <th>Vascular age</th>
                <td id="vascularAge">Vascular age</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
