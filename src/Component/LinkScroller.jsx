import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { hashLinks } from "../lib/constants";
const links = [
  {
    hash: hashLinks.whatWeDo,
  },
  {
    hash: hashLinks.technology,
    offset: -100,
  },
];

export const LinkScroller = () => {
  const location = useLocation();

  useEffect(() => {
    links.forEach(({ hash, offset = 0 }) => {
      if (location.hash === hash) {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY + offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    });
  }, [location]);
  return <></>;
};
