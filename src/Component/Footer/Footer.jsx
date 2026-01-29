import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import "./Footer.css";
import {Link, useNavigate} from "react-router-dom";
import { AuthContext } from "../AuthProvider";
function Footer() {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authData } = useContext(AuthContext);

  return (
    <footer className="footer_1">
      <div className="footer-content">
        <div className="footer-link-container">
          <div className="footer-section">
            <h4>{t('footer.companyName')}</h4>
            <ul>
              <li>
                <Link to="/">{t('navigation.home')}</Link>
              </li>
              <li
                style={{ cursor: "pointer" }}
              >
                <Link to="/#what-we-do">{t('footer.whatWeDo')}</Link>
              </li>
              <li
                style={{ cursor: "pointer" }}
              >
                <Link to="/#technology">{t('footer.ourAiTechnology')}</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-btn-container">
          <button
            className="contact-us-btn"
            onClick={() => navigate("/contact-us")}
          >
            {t('footer.contactUs')}
          </button>
          <button
            className="contact-us-btn"
            onClick={() => navigate("/demos")}
          >
            {t('navbar.tryDemo')}
          </button>
          <button
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            {authData?.user ? t('footer.logout') : t('footer.login')}
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{t('footer.copyright')}</p>
        <p><Link to="/terms">{t('footer.termsConditions')}</Link> - <Link to="/privacy">{t('footer.privacyPolicy')}</Link></p>
      </div>
    </footer>
  );
}

export default Footer;
