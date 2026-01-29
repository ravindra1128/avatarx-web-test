import { rawTermsHtml } from "./termsRaw";

const Terms = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background w-full mt-20">
      <div className="w-full max-w-lg space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
        <div dangerouslySetInnerHTML={{ __html: rawTermsHtml }}></div>
      </div>
    </div>
  );
};

export default Terms;
